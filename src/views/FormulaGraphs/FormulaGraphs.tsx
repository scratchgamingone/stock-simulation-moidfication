import * as React from 'react';
import { connect } from 'react-redux';
import { Card, Row, Col } from 'react-bootstrap';
import { Bar, Line, Scatter } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Filler,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { AppState, Stock } from '../../state/AppState';
import { getStocksByOwnedQuantity } from '../../state/stockMarket/stockSelector';
import {
    beta,
    correlation,
    linearRegression,
    mean,
    sampleStandardDeviation,
    simpleReturns,
    sortinoRatio,
    valueAtRisk
} from '../../util/statisticsToolkit';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Filler,
    Title,
    Tooltip,
    Legend
);

interface FormulaGraphsProps {
    stocks: Stock[];
}

type GraphMode = 'per-stock' | 'portfolio-weighted' | 'category';

interface FormulaGraphsState {
    mode: GraphMode;
    quizAnswers: { [questionId: number]: number };
    showQuizScore: boolean;
}

interface FormulaMetrics {
    name: string;
    meanReturnPct: number;
    volatilityPct: number;
    annualizedVolatilityPct: number;
    sortinoApprox: number;
    betaToBenchmark: number;
    valueAtRisk95Pct: number;
    trendSlope: number;
    weightPct: number;
    category?: string;
}

interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctIndex: number;
}

class FormulaGraphs extends React.Component<FormulaGraphsProps, FormulaGraphsState> {

    constructor(props: FormulaGraphsProps) {
        super(props);
        this.state = {
            mode: 'per-stock',
            quizAnswers: {},
            showQuizScore: false
        };
    }

    private readonly quickLessons = [
        {
            title: 'Risk-Return Tradeoff',
            plainEnglish: 'Higher average return usually comes with higher volatility risk.',
            formula: 'expected return vs std(returns)'
        },
        {
            title: 'Diversification',
            plainEnglish: 'Combining less-correlated assets can reduce portfolio volatility.',
            formula: 'portfolio variance depends on correlations'
        },
        {
            title: 'Tail Risk',
            plainEnglish: 'Rare bad outcomes matter, even if average return looks good.',
            formula: 'VaR_95 = 5th percentile of returns'
        },
        {
            title: 'Downside-Focused Performance',
            plainEnglish: 'Sortino ratio penalizes only downside variability.',
            formula: 'Sortino = (mean return - rf) / downside deviation'
        },
        {
            title: 'Market Sensitivity',
            plainEnglish: 'Beta measures how strongly returns react to benchmark moves.',
            formula: 'beta = cov(asset, benchmark) / var(benchmark)'
        },
        {
            title: 'Trend Signal',
            plainEnglish: 'Regression slope indicates the direction and pace of change.',
            formula: 'price_t = a + b*t'
        }
    ];

    private readonly quizQuestions: QuizQuestion[] = [
        {
            id: 1,
            question: 'Which metric focuses only on downside volatility?',
            options: ['Sharpe Ratio', 'Sortino Ratio', 'Beta', 'Correlation'],
            correctIndex: 1
        },
        {
            id: 2,
            question: 'If beta = 1.5, what does it imply?',
            options: ['Less volatile than benchmark', 'No relationship to benchmark', 'More sensitive than benchmark', 'Guaranteed outperformance'],
            correctIndex: 2
        },
        {
            id: 3,
            question: 'VaR 95% represents:',
            options: ['Best 5% gain', 'Typical daily gain', 'Bad-day threshold with 95% confidence', 'Average drawdown'],
            correctIndex: 2
        },
        {
            id: 4,
            question: 'Correlation near 0 between two holdings is generally useful for:',
            options: ['Increasing concentration risk', 'Diversification benefits', 'Eliminating all losses', 'Raising beta'],
            correctIndex: 1
        },
        {
            id: 5,
            question: 'A large max drawdown means:',
            options: ['Portfolio had deep decline from a prior peak', 'Volatility is zero', 'Returns are always positive', 'Benchmark is irrelevant'],
            correctIndex: 0
        }
    ];

    private buildPriceSeries(stock: Stock): number[] {
        const historyPrices = (stock.valueHistory || [])
            .map((point) => point.value)
            .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);

        if (historyPrices.length >= 2) {
            return historyPrices;
        }

        // Fallback when history is short: infer a prior value from valueChange.
        if (Number.isFinite(stock.value) && Number.isFinite(stock.valueChange)) {
            const priorValue = stock.value / (1 + stock.valueChange / 100);
            if (Number.isFinite(priorValue) && priorValue > 0) {
                return [priorValue, stock.value];
            }
        }

        return [stock.value, stock.value];
    }

    private getOwnedStocks(): Stock[] {
        return this.props.stocks.filter((stock) => stock.quantity > 0);
    }

    private alignReturnSeries(stocks: Stock[]): { [stockName: string]: number[] } {
        const map: { [stockName: string]: number[] } = {};
        const allReturns = stocks.map((stock) => {
            const returns = simpleReturns(this.buildPriceSeries(stock));
            return {
                name: stock.name,
                values: returns
            };
        }).filter((item) => item.values.length > 0);

        if (allReturns.length === 0) {
            return map;
        }

        const minLen = Math.min(...allReturns.map((item) => item.values.length));
        allReturns.forEach((item) => {
            map[item.name] = item.values.slice(item.values.length - minLen);
        });

        return map;
    }

    private getPerStockMetrics(): FormulaMetrics[] {
        const ownedStocks = this.props.stocks.filter((stock) => stock.quantity > 0);
        const totalValue = ownedStocks.reduce((sum, stock) => sum + stock.quantity * stock.value, 0);
        const alignedReturns = this.alignReturnSeries(ownedStocks);

        const benchmarkReturns = this.getBenchmarkReturns(ownedStocks, alignedReturns);

        return ownedStocks
            .map((stock) => {
                const prices = this.buildPriceSeries(stock);
                const returns = simpleReturns(prices);
                const avgReturn = mean(returns);
                const volatility = sampleStandardDeviation(returns);
                const annualizedVolatility = volatility * Math.sqrt(252);
                const var95 = valueAtRisk(returns, 0.95);
                const trend = linearRegression(prices);
                const riskFreeDaily = 0.02 / 252;
                const sortinoApprox = sortinoRatio(returns, riskFreeDaily, 0, 252);
                const safeBenchmark = benchmarkReturns.length > 0 ? benchmarkReturns : returns;
                const stockAligned = alignedReturns[stock.name] || returns;
                const betaToBenchmark = beta(stockAligned, safeBenchmark);
                const stockValue = stock.quantity * stock.value;
                const weightPct = totalValue > 0 ? (stockValue / totalValue) * 100 : 0;

                return {
                    name: stock.name,
                    meanReturnPct: avgReturn * 100,
                    volatilityPct: volatility * 100,
                    annualizedVolatilityPct: annualizedVolatility * 100,
                    sortinoApprox,
                    betaToBenchmark,
                    valueAtRisk95Pct: var95 * 100,
                    trendSlope: trend.slope,
                    weightPct,
                    category: stock.type
                };
            })
            .sort((a, b) => b.meanReturnPct - a.meanReturnPct)
            .slice(0, 12);
    }

    private getBenchmarkReturns(ownedStocks: Stock[], alignedReturns: { [stockName: string]: number[] }): number[] {
        if (ownedStocks.length === 0) {
            return [];
        }

        const stockSeries = ownedStocks
            .map((stock) => alignedReturns[stock.name] || [])
            .filter((series) => series.length > 0);

        if (stockSeries.length === 0) {
            return [];
        }

        const length = Math.min(...stockSeries.map((series) => series.length));
        const benchmark: number[] = [];

        for (let i = 0; i < length; i++) {
            const sum = stockSeries.reduce((acc, series) => acc + series[i], 0);
            benchmark.push(sum / stockSeries.length);
        }

        return benchmark;
    }

    private getPortfolioReturns(ownedStocks: Stock[], alignedReturns: { [stockName: string]: number[] }): number[] {
        const weightedStocks = ownedStocks
            .map((stock) => {
                const value = stock.quantity * stock.value;
                return {
                    stock,
                    value,
                    returns: alignedReturns[stock.name] || []
                };
            })
            .filter((item) => item.returns.length > 0 && item.value > 0);

        if (weightedStocks.length === 0) {
            return [];
        }

        const totalValue = weightedStocks.reduce((sum, item) => sum + item.value, 0);
        const length = Math.min(...weightedStocks.map((item) => item.returns.length));
        const portfolioReturns: number[] = [];

        for (let i = 0; i < length; i++) {
            const weightedReturn = weightedStocks.reduce((sum, item) => {
                const weight = totalValue > 0 ? item.value / totalValue : 0;
                return sum + (item.returns[i] * weight);
            }, 0);
            portfolioReturns.push(weightedReturn);
        }

        return portfolioReturns;
    }

    private getCategoryMetrics(perStock: FormulaMetrics[]): FormulaMetrics[] {
        const groups: { [categoryName: string]: FormulaMetrics[] } = {};

        perStock.forEach((item) => {
            const category = item.category || 'Unknown';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(item);
        });

        return Object.keys(groups).map((category) => {
            const items = groups[category];
            const totalWeight = items.reduce((sum, i) => sum + i.weightPct, 0) || 1;

            const weightedAverage = (selector: (value: FormulaMetrics) => number) => {
                return items.reduce((sum, item) => sum + selector(item) * (item.weightPct / totalWeight), 0);
            };

            return {
                name: category,
                meanReturnPct: weightedAverage((i) => i.meanReturnPct),
                volatilityPct: weightedAverage((i) => i.volatilityPct),
                annualizedVolatilityPct: weightedAverage((i) => i.annualizedVolatilityPct),
                sortinoApprox: weightedAverage((i) => i.sortinoApprox),
                betaToBenchmark: weightedAverage((i) => i.betaToBenchmark),
                valueAtRisk95Pct: weightedAverage((i) => i.valueAtRisk95Pct),
                trendSlope: weightedAverage((i) => i.trendSlope),
                weightPct: totalWeight
            };
        }).sort((a, b) => b.weightPct - a.weightPct);
    }

    private getMetricsByMode(): FormulaMetrics[] {
        const perStock = this.getPerStockMetrics();

        if (this.state.mode === 'category') {
            return this.getCategoryMetrics(perStock);
        }

        if (this.state.mode === 'portfolio-weighted') {
            return perStock.map((item) => ({
                ...item,
                meanReturnPct: item.meanReturnPct * (item.weightPct / 100),
                volatilityPct: item.volatilityPct * (item.weightPct / 100),
                annualizedVolatilityPct: item.annualizedVolatilityPct * (item.weightPct / 100),
                valueAtRisk95Pct: item.valueAtRisk95Pct * (item.weightPct / 100),
                trendSlope: item.trendSlope * (item.weightPct / 100),
                name: `${item.name} (${item.weightPct.toFixed(1)}%)`
            })).sort((a, b) => b.weightPct - a.weightPct);
        }

        return perStock;
    }

    private getDrawdownSeries(portfolioReturns: number[]): number[] {
        if (portfolioReturns.length === 0) {
            return [];
        }

        const valuePath: number[] = [];
        let value = 100;
        portfolioReturns.forEach((r) => {
            value = value * (1 + r);
            valuePath.push(value);
        });

        const drawdowns: number[] = [];
        let peak = valuePath[0] || 100;
        valuePath.forEach((current) => {
            peak = Math.max(peak, current);
            const drawdown = peak > 0 ? ((current - peak) / peak) * 100 : 0;
            drawdowns.push(drawdown);
        });

        return drawdowns;
    }

    private getCorrelationMatrix(ownedStocks: Stock[]): { labels: string[]; matrix: number[][] } {
        const alignedReturns = this.alignReturnSeries(ownedStocks);
        const labels = ownedStocks.map((stock) => stock.name).slice(0, 8);

        const matrix = labels.map((rowName) => {
            return labels.map((colName) => {
                const a = alignedReturns[rowName] || [];
                const b = alignedReturns[colName] || [];
                return correlation(a, b);
            });
        });

        return { labels, matrix };
    }

    private formatPercent(value: number): string {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    }

    private getChartOptions(title: string) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: title
                }
            }
        };
    }

    private getModeButtonClass(mode: GraphMode): string {
        return this.state.mode === mode ? 'btn btn-primary btn-sm' : 'btn btn-outline-primary btn-sm';
    }

    private getQuizScore(): { correct: number; total: number; percent: number } {
        let correct = 0;
        const total = this.quizQuestions.length;

        this.quizQuestions.forEach((question) => {
            if (this.state.quizAnswers[question.id] === question.correctIndex) {
                correct += 1;
            }
        });

        return {
            correct,
            total,
            percent: total > 0 ? (correct / total) * 100 : 0
        };
    }

    private getPortfolioDepthMetrics(ownedStocks: Stock[]) {
        const alignedReturns = this.alignReturnSeries(ownedStocks);
        const portfolioReturns = this.getPortfolioReturns(ownedStocks, alignedReturns);
        const benchmarkReturns = this.getBenchmarkReturns(ownedStocks, alignedReturns);
        const riskFreeDaily = 0.02 / 252;

        const avg = mean(portfolioReturns);
        const vol = sampleStandardDeviation(portfolioReturns);
        const annualVol = vol * Math.sqrt(252);
        const sortino = sortinoRatio(portfolioReturns, riskFreeDaily, 0, 252);
        const betaToBenchmark = beta(portfolioReturns, benchmarkReturns.length > 0 ? benchmarkReturns : portfolioReturns);
        const var95 = valueAtRisk(portfolioReturns, 0.95) * 100;
        const drawdownSeries = this.getDrawdownSeries(portfolioReturns);
        const maxDrawdown = drawdownSeries.length > 0 ? Math.min(...drawdownSeries) : 0;

        return {
            avgReturnPct: avg * 100,
            volatilityPct: vol * 100,
            annualizedVolatilityPct: annualVol * 100,
            sortino,
            betaToBenchmark,
            valueAtRisk95Pct: var95,
            maxDrawdownPct: maxDrawdown,
            drawdownSeries,
            portfolioReturns
        };
    }

    render() {
        const ownedStocks = this.getOwnedStocks();
        const metrics = this.getMetricsByMode();
        const portfolioDepth = this.getPortfolioDepthMetrics(ownedStocks);
        const correlationResult = this.getCorrelationMatrix(ownedStocks);
        const quizScore = this.getQuizScore();

        const labels = metrics.map((item) => item.name);

        const meanReturnData = {
            labels,
            datasets: [
                {
                    label: 'Mean Daily Return %',
                    data: metrics.map((item) => Number(item.meanReturnPct.toFixed(4))),
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        };

        const volatilityData = {
            labels,
            datasets: [
                {
                    label: 'Volatility %',
                    data: metrics.map((item) => Number(item.volatilityPct.toFixed(4))),
                    backgroundColor: 'rgba(255, 159, 64, 0.7)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }
            ]
        };

        const annualizedVolatilityData = {
            labels,
            datasets: [
                {
                    label: 'Annualized Volatility %',
                    data: metrics.map((item) => Number(item.annualizedVolatilityPct.toFixed(4))),
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        };

        const sharpeData = {
            labels,
            datasets: [
                {
                    label: 'Sortino (approx)',
                    data: metrics.map((item) => Number(item.sortinoApprox.toFixed(4))),
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }
            ]
        };

        const varData = {
            labels,
            datasets: [
                {
                    label: 'VaR 95% (Daily %) ',
                    data: metrics.map((item) => Number(item.valueAtRisk95Pct.toFixed(4))),
                    backgroundColor: 'rgba(153, 102, 255, 0.7)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }
            ]
        };

        const trendData = {
            labels,
            datasets: [
                {
                    label: 'Trend Slope',
                    data: metrics.map((item) => Number(item.trendSlope.toFixed(6))),
                    backgroundColor: 'rgba(46, 204, 113, 0.7)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1
                }
            ]
        };

        const betaData = {
            labels,
            datasets: [
                {
                    label: 'Beta to Benchmark',
                    data: metrics.map((item) => Number(item.betaToBenchmark.toFixed(4))),
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }
            ]
        };

        const riskReturnScatterData = {
            datasets: [
                {
                    label: 'Risk vs Return',
                    data: metrics.map((item) => ({
                        x: Number(item.volatilityPct.toFixed(4)),
                        y: Number(item.meanReturnPct.toFixed(4))
                    })),
                    backgroundColor: 'rgba(231, 76, 60, 0.7)',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    pointRadius: 6
                }
            ]
        };

        const drawdownData = {
            labels: portfolioDepth.drawdownSeries.map((_, index) => `${index + 1}`),
            datasets: [
                {
                    label: 'Portfolio Drawdown %',
                    data: portfolioDepth.drawdownSeries.map((value) => Number(value.toFixed(4))),
                    borderColor: 'rgba(192, 57, 43, 1)',
                    backgroundColor: 'rgba(192, 57, 43, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2
                }
            ]
        };

        const scatterOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Risk-Return Scatter (x = volatility %, y = mean return %)'
                }
            }
        };

        return (
            <div className="content">
                <div className="container-fluid">
                    <Row>
                        <Col md={12}>
                            <h3>
                                <i className="pe-7s-graph3" style={{ marginRight: '10px' }}></i>
                                Formula Graphs
                            </h3>
                            <p className="text-muted" style={{ marginBottom: '20px' }}>
                                All formula-based charts in one place, computed from currently owned stocks.
                            </p>
                            <div className="btn-group" role="group" style={{ marginBottom: '16px' }}>
                                <button
                                    className={this.getModeButtonClass('per-stock')}
                                    onClick={() => this.setState({ mode: 'per-stock' })}
                                >
                                    Per Stock
                                </button>
                                <button
                                    className={this.getModeButtonClass('portfolio-weighted')}
                                    onClick={() => this.setState({ mode: 'portfolio-weighted' })}
                                >
                                    Portfolio Weighted
                                </button>
                                <button
                                    className={this.getModeButtonClass('category')}
                                    onClick={() => this.setState({ mode: 'category' })}
                                >
                                    By Category
                                </button>
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">Formulas In Use (Owned Stocks Only)</Card.Title>
                                    <p className="card-category">These equations are applied to each owned stock using its price history.</p>
                                </Card.Header>
                                <Card.Body>
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Formula</th>
                                                    <th>Expression</th>
                                                    <th>Used For</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>Mean Return</td>
                                                    <td>mean(r) = sum(r) / n</td>
                                                    <td>Average daily return per owned stock</td>
                                                </tr>
                                                <tr>
                                                    <td>Volatility</td>
                                                    <td>sigma = std(r)</td>
                                                    <td>Daily return risk per owned stock</td>
                                                </tr>
                                                <tr>
                                                    <td>Annualized Volatility</td>
                                                    <td>sigma_annual = sigma_daily * sqrt(252)</td>
                                                    <td>Year-scaled risk comparison</td>
                                                </tr>
                                                <tr>
                                                    <td>Sortino (approx)</td>
                                                    <td>Sortino = (mean(r) - rf) / downsideDeviation * sqrt(252)</td>
                                                    <td>Downside-focused risk-adjusted ranking</td>
                                                </tr>
                                                <tr>
                                                    <td>Beta</td>
                                                    <td>beta = cov(asset, benchmark) / var(benchmark)</td>
                                                    <td>Sensitivity to market benchmark movement</td>
                                                </tr>
                                                <tr>
                                                    <td>VaR 95%</td>
                                                    <td>VaR_95 = quantile(r, 5%)</td>
                                                    <td>Estimated bad-day threshold</td>
                                                </tr>
                                                <tr>
                                                    <td>Trend Slope</td>
                                                    <td>Price_t = a + b*t, slope = b</td>
                                                    <td>Direction and strength of price trend</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={4}>
                            <Card>
                                <Card.Body>
                                    <p className="card-category">Portfolio Mean Return</p>
                                    <h5 className={portfolioDepth.avgReturnPct >= 0 ? 'text-success' : 'text-danger'}>{this.formatPercent(portfolioDepth.avgReturnPct)}</h5>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card>
                                <Card.Body>
                                    <p className="card-category">Portfolio Sortino</p>
                                    <h5 className={portfolioDepth.sortino >= 0 ? 'text-success' : 'text-danger'}>{portfolioDepth.sortino.toFixed(2)}</h5>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card>
                                <Card.Body>
                                    <p className="card-category">Portfolio Beta</p>
                                    <h5>{portfolioDepth.betaToBenchmark.toFixed(2)}</h5>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={4}>
                            <Card>
                                <Card.Body>
                                    <p className="card-category">Portfolio Volatility</p>
                                    <h5>{this.formatPercent(portfolioDepth.volatilityPct)}</h5>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card>
                                <Card.Body>
                                    <p className="card-category">Annualized Volatility</p>
                                    <h5>{this.formatPercent(portfolioDepth.annualizedVolatilityPct)}</h5>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card>
                                <Card.Body>
                                    <p className="card-category">Max Drawdown</p>
                                    <h5 className="text-danger">{this.formatPercent(portfolioDepth.maxDrawdownPct)}</h5>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {ownedStocks.length === 0 ? (
                        <Row>
                            <Col md={12}>
                                <Card>
                                    <Card.Body>
                                        <div className="text-center" style={{ padding: '40px' }}>
                                            <i className="pe-7s-info" style={{ fontSize: '48px', color: '#999', marginBottom: '10px', display: 'block' }}></i>
                                            <p className="text-muted" style={{ marginBottom: 0 }}>
                                                You currently own no stocks. Buy at least one stock to populate formula graphs.
                                            </p>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    ) : (
                        <>
                            <Row>
                                <Col md={6}>
                                    <Card>
                                        <Card.Body>
                                            <div style={{ height: '320px' }}>
                                                <Bar data={meanReturnData} options={this.getChartOptions('Mean Daily Return (%) by Owned Stock')} />
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card>
                                        <Card.Body>
                                            <div style={{ height: '320px' }}>
                                                <Bar data={volatilityData} options={this.getChartOptions('Daily Volatility (%) by Owned Stock')} />
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Card>
                                        <Card.Body>
                                            <div style={{ height: '320px' }}>
                                                <Bar data={annualizedVolatilityData} options={this.getChartOptions('Annualized Volatility (%) by Owned Stock')} />
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card>
                                        <Card.Body>
                                            <div style={{ height: '320px' }}>
                                                <Bar data={sharpeData} options={this.getChartOptions('Sortino Ratio (Approx)')} />
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Card>
                                        <Card.Body>
                                            <div style={{ height: '320px' }}>
                                                <Bar data={varData} options={this.getChartOptions('VaR 95% (Daily %) by Owned Stock')} />
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card>
                                        <Card.Body>
                                            <div style={{ height: '320px' }}>
                                                <Bar data={trendData} options={this.getChartOptions('Linear Trend Slope by Owned Stock')} />
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Card>
                                        <Card.Body>
                                            <div style={{ height: '320px' }}>
                                                <Bar data={betaData} options={this.getChartOptions('Beta to Benchmark')} />
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card>
                                        <Card.Body>
                                            <div style={{ height: '320px' }}>
                                                <Scatter data={riskReturnScatterData} options={scatterOptions} />
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={12}>
                                    <Card>
                                        <Card.Header>
                                            <Card.Title as="h4">Portfolio Drawdown Curve</Card.Title>
                                            <p className="card-category">Peak-to-trough path based on weighted portfolio returns</p>
                                        </Card.Header>
                                        <Card.Body>
                                            <div style={{ height: '300px' }}>
                                                {portfolioDepth.drawdownSeries.length > 0 ? (
                                                    <Line data={drawdownData} options={this.getChartOptions('Drawdown % Over Time')} />
                                                ) : (
                                                    <div className="text-center" style={{ padding: '70px' }}>
                                                        <p className="text-muted">Not enough return history to compute drawdown.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={12}>
                                    <Card>
                                        <Card.Header>
                                            <Card.Title as="h4">Correlation Matrix (Owned Stocks)</Card.Title>
                                            <p className="card-category">Pairwise relationship strength for diversification decisions</p>
                                        </Card.Header>
                                        <Card.Body>
                                            {correlationResult.labels.length > 1 ? (
                                                <div className="table-responsive">
                                                    <table className="table table-hover">
                                                        <thead>
                                                            <tr>
                                                                <th>Stock</th>
                                                                {correlationResult.labels.map((label) => (
                                                                    <th key={`head-${label}`}>{label}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {correlationResult.labels.map((rowLabel, rowIndex) => (
                                                                <tr key={`row-${rowLabel}`}>
                                                                    <td><strong>{rowLabel}</strong></td>
                                                                    {correlationResult.matrix[rowIndex].map((value, colIndex) => (
                                                                        <td
                                                                            key={`${rowLabel}-${colIndex}`}
                                                                            className={value > 0.6 ? 'text-danger' : value < 0.2 ? 'text-success' : ''}
                                                                        >
                                                                            {value.toFixed(2)}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="text-muted" style={{ marginBottom: 0 }}>
                                                    Need at least two owned stocks with history to compute correlations.
                                                </p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={12}>
                                    <Card>
                                        <Card.Header>
                                            <Card.Title as="h4">Statistics Mini Lessons</Card.Title>
                                            <p className="card-category">Fast concept refreshers for stats-major readiness</p>
                                        </Card.Header>
                                        <Card.Body>
                                            <Row>
                                                {this.quickLessons.map((lesson) => (
                                                    <Col md={4} key={lesson.title}>
                                                        <Card style={{ marginBottom: '15px' }}>
                                                            <Card.Body>
                                                                <h5 style={{ marginTop: 0 }}>{lesson.title}</h5>
                                                                <p style={{ minHeight: '56px' }}>{lesson.plainEnglish}</p>
                                                                <p className="text-muted" style={{ marginBottom: 0 }}><strong>Formula:</strong> {lesson.formula}</p>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={12}>
                                    <Card>
                                        <Card.Header>
                                            <Card.Title as="h4">Quick Self-Test (5 Questions)</Card.Title>
                                            <p className="card-category">Check understanding of formula meaning and interpretation</p>
                                        </Card.Header>
                                        <Card.Body>
                                            {this.quizQuestions.map((question) => (
                                                <div key={question.id} style={{ marginBottom: '18px' }}>
                                                    <p style={{ fontWeight: 600, marginBottom: '8px' }}>{question.id}. {question.question}</p>
                                                    <div className="btn-group" style={{ flexWrap: 'wrap' }}>
                                                        {question.options.map((option, optionIndex) => (
                                                            <button
                                                                key={`${question.id}-${option}`}
                                                                className={this.state.quizAnswers[question.id] === optionIndex
                                                                    ? 'btn btn-info btn-sm'
                                                                    : 'btn btn-outline-info btn-sm'}
                                                                onClick={() => this.setState({
                                                                    quizAnswers: {
                                                                        ...this.state.quizAnswers,
                                                                        [question.id]: optionIndex
                                                                    }
                                                                })}
                                                                style={{ marginRight: '8px', marginBottom: '8px' }}
                                                            >
                                                                {option}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}

                                            <div style={{ marginTop: '10px' }}>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => this.setState({ showQuizScore: true })}
                                                >
                                                    Grade Quiz
                                                </button>
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    style={{ marginLeft: '10px' }}
                                                    onClick={() => this.setState({ quizAnswers: {}, showQuizScore: false })}
                                                >
                                                    Reset
                                                </button>
                                            </div>

                                            {this.state.showQuizScore && (
                                                <div style={{ marginTop: '14px' }}>
                                                    <h5 style={{ marginBottom: '4px' }}>Score: {quizScore.correct}/{quizScore.total} ({quizScore.percent.toFixed(0)}%)</h5>
                                                    <p className="text-muted" style={{ marginBottom: 0 }}>
                                                        {quizScore.percent >= 80
                                                            ? 'Great work. Your stats interpretation is strong.'
                                                            : 'Keep reviewing formulas above and try again.'}
                                                    </p>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={12}>
                                    <Card>
                                        <Card.Header>
                                            <Card.Title as="h4">Current Formula Output Snapshot</Card.Title>
                                            <p className="card-category">Live values generated from your owned positions</p>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>Stock</th>
                                                            <th>Mean Return</th>
                                                            <th>Volatility</th>
                                                            <th>Ann. Volatility</th>
                                                            <th>Sortino (approx)</th>
                                                            <th>Beta</th>
                                                            <th>VaR 95%</th>
                                                            <th>Trend Slope</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {metrics.map((item) => (
                                                            <tr key={item.name}>
                                                                <td><strong>{item.name}</strong></td>
                                                                <td className={item.meanReturnPct >= 0 ? 'text-success' : 'text-danger'}>{this.formatPercent(item.meanReturnPct)}</td>
                                                                <td>{this.formatPercent(item.volatilityPct)}</td>
                                                                <td>{this.formatPercent(item.annualizedVolatilityPct)}</td>
                                                                <td className={item.sortinoApprox >= 0 ? 'text-success' : 'text-danger'}>{item.sortinoApprox.toFixed(2)}</td>
                                                                <td>{item.betaToBenchmark.toFixed(2)}</td>
                                                                <td className={item.valueAtRisk95Pct >= 0 ? 'text-success' : 'text-danger'}>{this.formatPercent(item.valueAtRisk95Pct)}</td>
                                                                <td>{item.trendSlope.toFixed(6)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state: AppState) => ({
    stocks: getStocksByOwnedQuantity(state)
});

export default connect(mapStateToProps)(FormulaGraphs);
