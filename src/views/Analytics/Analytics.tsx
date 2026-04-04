import * as React from 'react';
import { connect } from 'react-redux';
import { Card, Row, Col, Table, Badge } from 'react-bootstrap';
import { AppState, Stock } from '../../state/AppState';
import { Transaction } from '../../state/transactions/transactionActions';
import { getStocksByOwnedQuantity } from '../../state/stockMarket/stockSelector';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { 
    fetchStockHistoricalData, 
    fetchStockPrediction,
    StockHistoricalData,
    getApiStatus,
    getSymbolFromName
} from '../../services/stockApiService';
import {
    conditionalValueAtRisk,
    excessKurtosis,
    linearRegression,
    mean,
    median,
    sampleStandardDeviation,
    simpleReturns,
    skewness,
    valueAtRisk
} from '../../util/statisticsToolkit';
import './Analytics.css';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface AnalyticsProps {
    transactions: Transaction[];
    stocks: Stock[];
    accountValue: number;
}

interface AnalyticsState {
    selectedStock: string | null;
    historicalData: StockHistoricalData | null;
    prediction: any | null;
    loading: boolean;
    timeRange: '1D' | '1W' | '1M' | '3M' | '1Y';
    historyError: string | null;
    shockPercent: number;
}

interface StockPopularity {
    name: string;
    buyCount: number;
    sellCount: number;
    totalVolume: number;
    netShares: number;
    currentValue: number;
}

interface RebalanceSuggestion {
    name: string;
    currentValue: number;
    targetValue: number;
    deltaValue: number;
    action: 'BUY' | 'SELL' | 'HOLD';
    shares: number;
    currentWeight: number;
    targetWeight: number;
}

interface BenchmarkRiskMetrics {
    totalPortfolioValue: number;
    benchmarkValue: number;
    outperformanceValue: number;
    outperformancePercent: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
}

interface PortfolioStatistics {
    meanReturnDaily: number;
    medianReturnDaily: number;
    volatilityDaily: number;
    volatilityAnnualized: number;
    skewness: number;
    excessKurtosis: number;
    valueAtRisk95: number;
    conditionalValueAtRisk95: number;
    winRate: number;
    trendSlope: number;
    trendRSquared: number;
}

interface HoldingPerformance {
    name: string;
    quantity: number;
    averageCost: number;
    marketPrice: number;
    totalBuys: number;
    totalSells: number;
    marketValue: number;
    costBasis: number;
    realizedPnl: number;
    unrealizedPnl: number;
    totalPnl: number;
    totalPnlPercent: number;
}

class Analytics extends React.Component<AnalyticsProps, AnalyticsState> {
    constructor(props: AnalyticsProps) {
        super(props);
        this.state = {
            selectedStock: null,
            historicalData: null,
            prediction: null,
            loading: false,
            timeRange: '1M',
            historyError: null,
            shockPercent: 0
        };
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    }

    formatDate(date: Date | string): string {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    getPortfolioValueSeries(): number[] {
        const { stocks, accountValue } = this.props;
        const maxPoints = stocks.reduce((max, stock) => Math.max(max, stock.valueHistory?.length || 0), 0);

        if (maxPoints <= 1) {
            const currentStockValue = stocks.reduce((sum, stock) => sum + (stock.quantity * stock.value), 0);
            return [accountValue + currentStockValue];
        }

        const series: number[] = [];
        for (let index = 0; index < maxPoints; index++) {
            const snapshotValue = stocks.reduce((sum, stock) => {
                const point = stock.valueHistory && stock.valueHistory[index];
                const price = point && typeof point.value === 'number' ? point.value : stock.value;
                return sum + (stock.quantity * price);
            }, 0);

            series.push(accountValue + snapshotValue);
        }

        return series;
    }

    // Get transaction timeline data for chart
    getTransactionTimelineData() {
        const { transactions } = this.props;
        
        // Group transactions by date
        const dateMap = new Map<string, { buy: number; sell: number }>();
        
        transactions.forEach(t => {
            const date = new Date(t.timestamp).toLocaleDateString();
            const existing = dateMap.get(date) || { buy: 0, sell: 0 };
            
            if (t.type === 'BUY') {
                existing.buy += t.totalValue;
            } else {
                existing.sell += t.totalValue;
            }
            
            dateMap.set(date, existing);
        });

        const sortedDates = Array.from(dateMap.keys()).sort((a, b) => 
            new Date(a).getTime() - new Date(b).getTime()
        );

        return {
            labels: sortedDates,
            datasets: [
                {
                    label: 'Buy Volume',
                    data: sortedDates.map(date => dateMap.get(date)!.buy),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: 'Sell Volume',
                    data: sortedDates.map(date => dateMap.get(date)!.sell),
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    fill: false
                }
            ]
        };
    }

    // Calculate stock popularity
    getStockPopularity(): StockPopularity[] {
        const { transactions, stocks } = this.props;
        const popularityMap = new Map<string, StockPopularity>();

        transactions.forEach(t => {
            const existing = popularityMap.get(t.stockName) || {
                name: t.stockName,
                buyCount: 0,
                sellCount: 0,
                totalVolume: 0,
                netShares: 0,
                currentValue: 0
            };

            if (t.type === 'BUY') {
                existing.buyCount++;
                existing.netShares += t.quantity;
            } else {
                existing.sellCount++;
                existing.netShares -= t.quantity;
            }

            existing.totalVolume += t.totalValue;
            popularityMap.set(t.stockName, existing);
        });

        // Add current stock values
        popularityMap.forEach((pop, stockName) => {
            const stock = stocks.find(s => s.name === stockName);
            if (stock) {
                pop.currentValue = stock.value;
            }
        });

        // Sort by total volume and return top 20
        return Array.from(popularityMap.values())
            .sort((a, b) => b.totalVolume - a.totalVolume)
            .slice(0, 20);
    }

    // Get portfolio distribution
    getPortfolioDistribution() {
        const { stocks } = this.props;
        const ownedStocks = stocks.filter(s => s.quantity > 0);

        const labels = ownedStocks.map(s => s.name);
        const data = ownedStocks.map(s => s.quantity * s.value);
        
        // Generate colors
        const colors = ownedStocks.map((_, i) => {
            const hue = (i * 360 / ownedStocks.length);
            return `hsla(${hue}, 70%, 60%, 0.8)`;
        });

        return {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.8', '1')),
                borderWidth: 2
            }]
        };
    }

    // Get transaction type distribution
    getTransactionTypeDistribution() {
        const { transactions } = this.props;
        const buyCount = transactions.filter(t => t.type === 'BUY').length;
        const sellCount = transactions.filter(t => t.type === 'SELL').length;

        return {
            labels: ['Buy', 'Sell'],
            datasets: [{
                data: [buyCount, sellCount],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 99, 132, 0.8)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 2
            }]
        };
    }

    getHoldingsValueBarData() {
        const { stocks } = this.props;
        const holdings = stocks
            .filter(stock => stock.quantity > 0)
            .map(stock => ({
                name: stock.name,
                value: stock.quantity * stock.value
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        return {
            labels: holdings.map(item => item.name),
            datasets: [
                {
                    label: 'Holding Value',
                    data: holdings.map(item => Number(item.value.toFixed(2))),
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }
            ]
        };
    }

    getStockPnlBarData() {
        const holdings = this.getHoldingPerformance()
            .slice(0, 10)
            .sort((a, b) => b.totalPnl - a.totalPnl);

        return {
            labels: holdings.map(item => item.name),
            datasets: [
                {
                    label: 'Total P/L',
                    data: holdings.map(item => Number(item.totalPnl.toFixed(2))),
                    backgroundColor: holdings.map(item => item.totalPnl >= 0
                        ? 'rgba(75, 192, 192, 0.7)'
                        : 'rgba(255, 99, 132, 0.7)'),
                    borderColor: holdings.map(item => item.totalPnl >= 0
                        ? 'rgba(75, 192, 192, 1)'
                        : 'rgba(255, 99, 132, 1)'),
                    borderWidth: 1
                }
            ]
        };
    }

    getStockActivityBarData() {
        const activityMap = new Map<string, { buys: number; sells: number }>();

        this.props.transactions.forEach((transaction) => {
            const current = activityMap.get(transaction.stockName) || { buys: 0, sells: 0 };
            if (transaction.type === 'BUY') {
                current.buys += transaction.quantity;
            } else {
                current.sells += transaction.quantity;
            }
            activityMap.set(transaction.stockName, current);
        });

        const activity = Array.from(activityMap.entries())
            .map(([name, counts]) => ({
                name,
                buys: counts.buys,
                sells: counts.sells,
                total: counts.buys + counts.sells
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        return {
            labels: activity.map(item => item.name),
            datasets: [
                {
                    label: 'Buy Shares',
                    data: activity.map(item => item.buys),
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Sell Shares',
                    data: activity.map(item => item.sells),
                    backgroundColor: 'rgba(255, 159, 64, 0.7)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }
            ]
        };
    }

    getBenchmarkRiskMetrics(): BenchmarkRiskMetrics {
        const { stocks, transactions, accountValue } = this.props;
        const initialCapital = 10000;

        const currentStockValue = stocks.reduce((sum, stock) => sum + (stock.quantity * stock.value), 0);
        const totalPortfolioValue = accountValue + currentStockValue;

        const firstDate = transactions.length > 0
            ? new Date(Math.min(...transactions.map((t) => new Date(t.timestamp).getTime())))
            : new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));

        const elapsedDays = Math.max(1, Math.floor((Date.now() - firstDate.getTime()) / (24 * 60 * 60 * 1000)));
        const annualBenchmarkReturn = 0.08;
        const benchmarkValue = initialCapital * Math.pow(1 + annualBenchmarkReturn, elapsedDays / 365);

        const outperformanceValue = totalPortfolioValue - benchmarkValue;
        const outperformancePercent = benchmarkValue > 0
            ? (outperformanceValue / benchmarkValue) * 100
            : 0;

        const series = this.getPortfolioValueSeries();

        let peak = series[0] || totalPortfolioValue;
        let maxDrawdown = 0;
        const returns = simpleReturns(series);

        for (let index = 0; index < series.length; index++) {
            const value = series[index];
            if (value > peak) {
                peak = value;
            }

            if (peak > 0) {
                const drawdown = (value - peak) / peak;
                if (drawdown < maxDrawdown) {
                    maxDrawdown = drawdown;
                }
            }

        }

        const meanReturn = mean(returns);
        const stdDev = sampleStandardDeviation(returns);
        const riskFreeDailyReturn = 0.02 / 252;
        const sharpeRatio = stdDev > 0
            ? ((meanReturn - riskFreeDailyReturn) / stdDev) * Math.sqrt(252)
            : 0;

        return {
            totalPortfolioValue,
            benchmarkValue,
            outperformanceValue,
            outperformancePercent,
            maxDrawdownPercent: Math.abs(maxDrawdown) * 100,
            sharpeRatio
        };
    }

    getPortfolioStatistics(): PortfolioStatistics {
        const series = this.getPortfolioValueSeries();
        const returns = simpleReturns(series);
        const trend = linearRegression(series);
        const wins = returns.filter((value) => value > 0).length;

        return {
            meanReturnDaily: mean(returns),
            medianReturnDaily: median(returns),
            volatilityDaily: sampleStandardDeviation(returns),
            volatilityAnnualized: sampleStandardDeviation(returns) * Math.sqrt(252),
            skewness: skewness(returns),
            excessKurtosis: excessKurtosis(returns),
            valueAtRisk95: valueAtRisk(returns, 0.95),
            conditionalValueAtRisk95: conditionalValueAtRisk(returns, 0.95),
            winRate: returns.length > 0 ? (wins / returns.length) * 100 : 0,
            trendSlope: trend.slope,
            trendRSquared: trend.rSquared
        };
    }

    getHoldingPerformance(): HoldingPerformance[] {
        const { transactions, stocks } = this.props;
        const performanceByStock = new Map<string, {
            quantity: number;
            costBasis: number;
            realizedPnl: number;
            totalBuys: number;
            totalSells: number;
        }>();

        const orderedTransactions = [...transactions].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        orderedTransactions.forEach((transaction) => {
            const existing = performanceByStock.get(transaction.stockName) || {
                quantity: 0,
                costBasis: 0,
                realizedPnl: 0,
                totalBuys: 0,
                totalSells: 0
            };

            if (transaction.type === 'BUY') {
                existing.quantity += transaction.quantity;
                existing.costBasis += transaction.totalValue;
                existing.totalBuys += transaction.totalValue;
            } else {
                existing.totalSells += transaction.totalValue;

                const safeQuantity = Math.max(existing.quantity, 0);
                const averageCost = safeQuantity > 0 ? existing.costBasis / safeQuantity : 0;
                const soldQuantity = Math.min(transaction.quantity, safeQuantity);
                const soldCost = soldQuantity * averageCost;

                existing.quantity = Math.max(existing.quantity - transaction.quantity, 0);
                existing.costBasis = Math.max(existing.costBasis - soldCost, 0);
                existing.realizedPnl += transaction.totalValue - soldCost;
            }

            performanceByStock.set(transaction.stockName, existing);
        });

        return Array.from(performanceByStock.entries())
            .map(([stockName, data]) => {
                const stock = stocks.find((item) => item.name === stockName);
                const marketPrice = stock ? stock.value : 0;
                const marketValue = data.quantity * marketPrice;
                const unrealizedPnl = marketValue - data.costBasis;
                const totalPnl = data.realizedPnl + unrealizedPnl;
                const pnlBase = data.totalBuys > 0 ? data.totalBuys : 1;

                return {
                    name: stockName,
                    quantity: data.quantity,
                    averageCost: data.quantity > 0 ? data.costBasis / data.quantity : 0,
                    marketPrice,
                    totalBuys: data.totalBuys,
                    totalSells: data.totalSells,
                    marketValue,
                    costBasis: data.costBasis,
                    realizedPnl: data.realizedPnl,
                    unrealizedPnl,
                    totalPnl,
                    totalPnlPercent: (totalPnl / pnlBase) * 100
                };
            })
            .sort((a, b) => b.totalPnl - a.totalPnl);
    }

    getShockSimulation(shockPercent: number) {
        const stockValueBefore = this.props.stocks.reduce(
            (sum, stock) => sum + (stock.quantity * stock.value),
            0
        );
        const stockValueAfter = this.props.stocks.reduce(
            (sum, stock) => sum + (stock.quantity * stock.value * (1 + shockPercent / 100)),
            0
        );

        const portfolioBefore = this.props.accountValue + stockValueBefore;
        const portfolioAfter = this.props.accountValue + stockValueAfter;

        return {
            stockValueBefore,
            stockValueAfter,
            portfolioBefore,
            portfolioAfter,
            deltaValue: portfolioAfter - portfolioBefore,
            deltaPercent: portfolioBefore > 0 ? ((portfolioAfter - portfolioBefore) / portfolioBefore) * 100 : 0
        };
    }

    // Rebalancing helper (equal-weight across all currently owned positions)
    getRebalanceSuggestions(): RebalanceSuggestion[] {
        const ownedStocks = this.props.stocks.filter(stock => stock.quantity > 0 && stock.value > 0);

        if (ownedStocks.length === 0) {
            return [];
        }

        const totalPortfolioValue = ownedStocks.reduce((sum, stock) => sum + stock.quantity * stock.value, 0);
        const targetValuePerStock = totalPortfolioValue / ownedStocks.length;
        const targetWeight = 1 / ownedStocks.length;

        return ownedStocks
            .map((stock) => {
                const currentValue = stock.quantity * stock.value;
                const deltaValue = targetValuePerStock - currentValue;
                const rawShares = Math.floor(Math.abs(deltaValue) / stock.value);

                let action: RebalanceSuggestion['action'] = 'HOLD';
                if (rawShares > 0) {
                    action = deltaValue > 0 ? 'BUY' : 'SELL';
                }

                return {
                    name: stock.name,
                    currentValue,
                    targetValue: targetValuePerStock,
                    deltaValue,
                    action,
                    shares: rawShares,
                    currentWeight: totalPortfolioValue > 0 ? currentValue / totalPortfolioValue : 0,
                    targetWeight
                };
            })
            .sort((a, b) => Math.abs(b.deltaValue) - Math.abs(a.deltaValue));
    }

    // Load historical data for a stock
    async loadStockHistory(stockName: string) {
        this.setState({ loading: true, selectedStock: stockName, historyError: null });
        
        try {
            const symbol = getSymbolFromName(stockName);
            if (!symbol) {
                this.setState({
                    loading: false,
                    historicalData: null,
                    prediction: null,
                    historyError: 'No market ticker mapping exists for this stock yet.'
                });
                return;
            }

            const { timeRange } = this.state;
            const historical = await fetchStockHistoricalData(stockName, timeRange);
            const prediction = await fetchStockPrediction(stockName);

            if (!historical || !historical.prices || historical.prices.length === 0) {
                const apiStatus = getApiStatus();
                const noKeysConfigured = !apiStatus.finnhubConfigured && !apiStatus.alphaVantageConfigured;

                this.setState({
                    historicalData: null,
                    prediction: null,
                    loading: false,
                    historyError: noKeysConfigured
                        ? 'API keys not detected. Configure REACT_APP_FINNHUB_API_KEY, REACT_APP_ALPHA_VANTAGE_API_KEY, REACT_APP_TWELVE_DATA_API_KEY, or REACT_APP_POLYGON_API_KEY and restart the dev server.'
                        : `No historical market data returned for ${stockName} (${symbol}) in the selected range.`
                });
                return;
            }
            
            this.setState({
                historicalData: historical,
                prediction,
                loading: false,
                historyError: null
            });
        } catch (error) {
            console.error('Error loading stock data:', error);
            this.setState({
                loading: false,
                historyError: 'Unexpected API error while loading historical data.'
            });
        }
    }

    // Get historical data chart
    getHistoricalDataChart() {
        const { historicalData, prediction } = this.state;
        
        if (!historicalData || !historicalData.prices.length) {
            return null;
        }

        const historicalLabels = historicalData.prices.map(p => 
            new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );
        const historicalPrices = historicalData.prices.map(p => p.price);

        const datasets: any[] = [
            {
                label: 'Historical Price',
                data: historicalPrices,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }
        ];

        // Add prediction if available
        if (prediction && prediction.prices && prediction.prices.length > 0) {
            const predictionLabels = prediction.prices.map((p: any) => 
                new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            );
            const predictionPrices = prediction.prices.map((p: any) => p.price);

            // Combine labels
            const allLabels = [...historicalLabels, ...predictionLabels];
            
            // Extend historical data with nulls for prediction period
            const extendedHistorical = [...historicalPrices, ...Array(predictionPrices.length).fill(null)];
            
            // Extend prediction with nulls for historical period
            const extendedPrediction = [...Array(historicalPrices.length).fill(null), historicalPrices[historicalPrices.length - 1], ...predictionPrices];

            datasets[0].data = extendedHistorical;
            datasets.push({
                label: 'Predicted Price',
                data: extendedPrediction,
                borderColor: 'rgba(255, 206, 86, 1)',
                backgroundColor: 'rgba(255, 206, 86, 0.1)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: true,
                tension: 0.4
            });

            return {
                labels: allLabels,
                datasets
            };
        }

        return {
            labels: historicalLabels,
            datasets
        };
    }

    render() {
        const { transactions, stocks } = this.props;
        const { selectedStock, loading, timeRange, historyError, shockPercent } = this.state;
        const popularStocks = this.getStockPopularity();
        const holdingPerformance = this.getHoldingPerformance();
        const timelineData = this.getTransactionTimelineData();
        const portfolioData = this.getPortfolioDistribution();
        const transactionTypeData = this.getTransactionTypeDistribution();
        const holdingsValueBarData = this.getHoldingsValueBarData();
        const stockPnlBarData = this.getStockPnlBarData();
        const stockActivityBarData = this.getStockActivityBarData();
        const benchmarkRiskMetrics = this.getBenchmarkRiskMetrics();
        const portfolioStatistics = this.getPortfolioStatistics();
        const shockSimulation = this.getShockSimulation(shockPercent);
        const rebalanceSuggestions = this.getRebalanceSuggestions();
        const highestWeight = rebalanceSuggestions.length > 0
            ? Math.max(...rebalanceSuggestions.map(item => item.currentWeight))
            : 0;
        const historicalChart = this.getHistoricalDataChart();

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top' as const,
                },
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        };

        const horizontalBarOptions = {
            ...chartOptions,
            indexAxis: 'y' as const
        };

        const stackedBarOptions = {
            ...chartOptions,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        };

        return (
            <div className="content">
                <div className="container-fluid">
                    {/* Header */}
                    <Row>
                        <Col md={12}>
                            <h3 className="analytics-title">
                                <i className="pe-7s-graph2" style={{ marginRight: '10px' }}></i>
                                Stock Market Analytics
                            </h3>
                            <p className="analytics-subtitle">
                                Stats-first dashboard with interpretable risk, return, and distribution metrics
                            </p>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={3}>
                            <Card>
                                <Card.Body>
                                    <p className="card-category">Portfolio Value</p>
                                    <h4>{this.formatCurrency(benchmarkRiskMetrics.totalPortfolioValue)}</h4>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card>
                                <Card.Body>
                                    <p className="card-category">Benchmark (8% annual)</p>
                                    <h4>{this.formatCurrency(benchmarkRiskMetrics.benchmarkValue)}</h4>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card>
                                <Card.Body>
                                    <p className="card-category">Outperformance</p>
                                    <h4 className={benchmarkRiskMetrics.outperformanceValue >= 0 ? 'text-success' : 'text-danger'}>
                                        {this.formatCurrency(benchmarkRiskMetrics.outperformanceValue)}
                                    </h4>
                                    <small className={benchmarkRiskMetrics.outperformancePercent >= 0 ? 'text-success' : 'text-danger'}>
                                        {benchmarkRiskMetrics.outperformancePercent >= 0 ? '+' : ''}{benchmarkRiskMetrics.outperformancePercent.toFixed(2)}%
                                    </small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card>
                                <Card.Body>
                                    <p className="card-category">Risk Snapshot</p>
                                    <h5 style={{ marginBottom: '6px' }}>Max Drawdown: {benchmarkRiskMetrics.maxDrawdownPercent.toFixed(2)}%</h5>
                                    <h5 style={{ marginBottom: 0 }}>Sharpe: {benchmarkRiskMetrics.sharpeRatio.toFixed(2)}</h5>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">
                                        <i className="pe-7s-calculator" style={{ marginRight: '8px' }}></i>
                                        Statistical Summary (Daily Returns)
                                    </Card.Title>
                                    <p className="card-category">Mean, median, dispersion, shape, and downside risk in one place</p>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={3}>
                                            <p className="card-category" style={{ marginBottom: '2px' }}>Mean Return</p>
                                            <h5 style={{ marginTop: 0 }}>{(portfolioStatistics.meanReturnDaily * 100).toFixed(3)}%</h5>
                                        </Col>
                                        <Col md={3}>
                                            <p className="card-category" style={{ marginBottom: '2px' }}>Median Return</p>
                                            <h5 style={{ marginTop: 0 }}>{(portfolioStatistics.medianReturnDaily * 100).toFixed(3)}%</h5>
                                        </Col>
                                        <Col md={3}>
                                            <p className="card-category" style={{ marginBottom: '2px' }}>Daily Volatility</p>
                                            <h5 style={{ marginTop: 0 }}>{(portfolioStatistics.volatilityDaily * 100).toFixed(3)}%</h5>
                                        </Col>
                                        <Col md={3}>
                                            <p className="card-category" style={{ marginBottom: '2px' }}>Annualized Volatility</p>
                                            <h5 style={{ marginTop: 0 }}>{(portfolioStatistics.volatilityAnnualized * 100).toFixed(2)}%</h5>
                                        </Col>
                                    </Row>
                                    <Row style={{ marginTop: '12px' }}>
                                        <Col md={2}>
                                            <p className="card-category" style={{ marginBottom: '2px' }}>Skewness</p>
                                            <h5 style={{ marginTop: 0 }}>{portfolioStatistics.skewness.toFixed(2)}</h5>
                                        </Col>
                                        <Col md={2}>
                                            <p className="card-category" style={{ marginBottom: '2px' }}>Excess Kurtosis</p>
                                            <h5 style={{ marginTop: 0 }}>{portfolioStatistics.excessKurtosis.toFixed(2)}</h5>
                                        </Col>
                                        <Col md={2}>
                                            <p className="card-category" style={{ marginBottom: '2px' }}>VaR 95%</p>
                                            <h5 style={{ marginTop: 0 }}>{(portfolioStatistics.valueAtRisk95 * 100).toFixed(2)}%</h5>
                                        </Col>
                                        <Col md={2}>
                                            <p className="card-category" style={{ marginBottom: '2px' }}>CVaR 95%</p>
                                            <h5 style={{ marginTop: 0 }}>{(portfolioStatistics.conditionalValueAtRisk95 * 100).toFixed(2)}%</h5>
                                        </Col>
                                        <Col md={2}>
                                            <p className="card-category" style={{ marginBottom: '2px' }}>Win Rate</p>
                                            <h5 style={{ marginTop: 0 }}>{portfolioStatistics.winRate.toFixed(1)}%</h5>
                                        </Col>
                                        <Col md={2}>
                                            <p className="card-category" style={{ marginBottom: '2px' }}>Trend R²</p>
                                            <h5 style={{ marginTop: 0 }}>{portfolioStatistics.trendRSquared.toFixed(2)}</h5>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">
                                        <i className="pe-7s-gleam" style={{ marginRight: '8px' }}></i>
                                        Market Shock Simulator
                                    </Card.Title>
                                    <p className="card-category">Instantly estimate portfolio impact under a broad market move</p>
                                </Card.Header>
                                <Card.Body>
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                            <strong>Simulated market move: {shockPercent > 0 ? '+' : ''}{shockPercent}%</strong>
                                            <button
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => this.setState({ shockPercent: 0 })}
                                            >
                                                Reset
                                            </button>
                                        </div>
                                        <input
                                            type="range"
                                            min={-30}
                                            max={30}
                                            step={1}
                                            value={shockPercent}
                                            onChange={(event) => this.setState({ shockPercent: Number(event.target.value) })}
                                            style={{ width: '100%', marginTop: '10px' }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#777', fontSize: '12px' }}>
                                            <span>-30%</span>
                                            <span>0%</span>
                                            <span>+30%</span>
                                        </div>
                                    </div>
                                    <Row>
                                        <Col md={3}>
                                            <p className="card-category" style={{ marginBottom: '2px' }}>Stock Value (Current)</p>
                                            <h5 style={{ marginTop: 0 }}>{this.formatCurrency(shockSimulation.stockValueBefore)}</h5>
                                        </Col>
                                        <Col md={3}>
                                            <p className="card-category" style={{ marginBottom: '2px' }}>Stock Value (Simulated)</p>
                                            <h5 style={{ marginTop: 0 }}>{this.formatCurrency(shockSimulation.stockValueAfter)}</h5>
                                        </Col>
                                        <Col md={3}>
                                            <p className="card-category" style={{ marginBottom: '2px' }}>Portfolio (Simulated)</p>
                                            <h5 style={{ marginTop: 0 }}>{this.formatCurrency(shockSimulation.portfolioAfter)}</h5>
                                        </Col>
                                        <Col md={3}>
                                            <p className="card-category" style={{ marginBottom: '2px' }}>Portfolio Delta</p>
                                            <h5
                                                className={shockSimulation.deltaValue >= 0 ? 'text-success' : 'text-danger'}
                                                style={{ marginTop: 0 }}
                                            >
                                                {this.formatCurrency(shockSimulation.deltaValue)}
                                            </h5>
                                            <small className={shockSimulation.deltaPercent >= 0 ? 'text-success' : 'text-danger'}>
                                                {shockSimulation.deltaPercent >= 0 ? '+' : ''}{shockSimulation.deltaPercent.toFixed(2)}%
                                            </small>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Transaction Timeline */}
                    <Row>
                        <Col md={12}>
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">Transaction Volume Over Time</Card.Title>
                                    <p className="card-category">Buy and sell activity timeline</p>
                                </Card.Header>
                                <Card.Body>
                                    <div style={{ height: '300px' }}>
                                        {transactions.length > 0 ? (
                                            <Line data={timelineData} options={chartOptions} />
                                        ) : (
                                            <div className="text-center" style={{ padding: '80px' }}>
                                                <p className="text-muted">No transactions to display</p>
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
                                    <Card.Title as="h4">
                                        <i className="pe-7s-medal" style={{ marginRight: '8px' }}></i>
                                        Position Performance Leaderboard
                                    </Card.Title>
                                    <p className="card-category">Realized + unrealized P/L ranked by stock</p>
                                </Card.Header>
                                <Card.Body>
                                    {holdingPerformance.length > 0 ? (
                                        <div className="table-responsive">
                                            <Table hover>
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Stock</th>
                                                        <th>Open Qty</th>
                                                        <th>Avg Cost</th>
                                                        <th>Market Price</th>
                                                        <th>Market Value</th>
                                                        <th>Realized P/L</th>
                                                        <th>Unrealized P/L</th>
                                                        <th>Total P/L</th>
                                                        <th>Total Return</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {holdingPerformance.map((item, index) => (
                                                        <tr key={item.name}>
                                                            <td><strong>#{index + 1}</strong></td>
                                                            <td><strong>{item.name}</strong></td>
                                                            <td>{item.quantity}</td>
                                                            <td>{this.formatCurrency(item.averageCost)}</td>
                                                            <td>{this.formatCurrency(item.marketPrice)}</td>
                                                            <td>{this.formatCurrency(item.marketValue)}</td>
                                                            <td className={item.realizedPnl >= 0 ? 'text-success' : 'text-danger'}>
                                                                {this.formatCurrency(item.realizedPnl)}
                                                            </td>
                                                            <td className={item.unrealizedPnl >= 0 ? 'text-success' : 'text-danger'}>
                                                                {this.formatCurrency(item.unrealizedPnl)}
                                                            </td>
                                                            <td className={item.totalPnl >= 0 ? 'text-success' : 'text-danger'}>
                                                                <strong>{this.formatCurrency(item.totalPnl)}</strong>
                                                            </td>
                                                            <td className={item.totalPnlPercent >= 0 ? 'text-success' : 'text-danger'}>
                                                                {item.totalPnlPercent >= 0 ? '+' : ''}{item.totalPnlPercent.toFixed(2)}%
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="text-center" style={{ padding: '40px' }}>
                                            <i className="pe-7s-info" style={{ fontSize: '48px', color: '#999', marginBottom: '10px', display: 'block' }}></i>
                                            <p className="text-muted">No transaction history available for P/L analysis</p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Portfolio Distribution & Transaction Types */}
                    <Row>
                        <Col md={6}>
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">Portfolio Distribution</Card.Title>
                                    <p className="card-category">Current holdings by value</p>
                                </Card.Header>
                                <Card.Body>
                                    <div style={{ height: '300px' }}>
                                        {stocks.filter(s => s.quantity > 0).length > 0 ? (
                                            <Pie data={portfolioData} options={{ responsive: true, maintainAspectRatio: false }} />
                                        ) : (
                                            <div className="text-center" style={{ padding: '80px' }}>
                                                <p className="text-muted">No stocks owned</p>
                                            </div>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">Transaction Type Distribution</Card.Title>
                                    <p className="card-category">Buy vs Sell transactions</p>
                                </Card.Header>
                                <Card.Body>
                                    <div style={{ height: '300px' }}>
                                        {transactions.length > 0 ? (
                                            <Pie data={transactionTypeData} options={{ responsive: true, maintainAspectRatio: false }} />
                                        ) : (
                                            <div className="text-center" style={{ padding: '80px' }}>
                                                <p className="text-muted">No transactions to display</p>
                                            </div>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">Top Holdings by Value (Bar)</Card.Title>
                                    <p className="card-category">Largest positions ranked by current market value</p>
                                </Card.Header>
                                <Card.Body>
                                    <div style={{ height: '320px' }}>
                                        {holdingsValueBarData.labels.length > 0 ? (
                                            <Bar data={holdingsValueBarData} options={horizontalBarOptions} />
                                        ) : (
                                            <div className="text-center" style={{ padding: '80px' }}>
                                                <p className="text-muted">No owned holdings to chart</p>
                                            </div>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">Stock P/L Comparison (Bar)</Card.Title>
                                    <p className="card-category">Positive vs negative performers by total P/L</p>
                                </Card.Header>
                                <Card.Body>
                                    <div style={{ height: '320px' }}>
                                        {stockPnlBarData.labels.length > 0 ? (
                                            <Bar data={stockPnlBarData} options={horizontalBarOptions} />
                                        ) : (
                                            <div className="text-center" style={{ padding: '80px' }}>
                                                <p className="text-muted">No position P/L data available</p>
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
                                    <Card.Title as="h4">Buy vs Sell Shares by Stock (Stacked Bar)</Card.Title>
                                    <p className="card-category">Most active stocks by executed share volume</p>
                                </Card.Header>
                                <Card.Body>
                                    <div style={{ height: '340px' }}>
                                        {stockActivityBarData.labels.length > 0 ? (
                                            <Bar data={stockActivityBarData} options={stackedBarOptions} />
                                        ) : (
                                            <div className="text-center" style={{ padding: '80px' }}>
                                                <p className="text-muted">No stock activity to chart</p>
                                            </div>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Top 20 Popular Stocks */}
                    <Row>
                        <Col md={12}>
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">
                                        <i className="pe-7s-shuffle" style={{ marginRight: '8px' }}></i>
                                        Portfolio Rebalancing Assistant
                                    </Card.Title>
                                    <p className="card-category">Equal-weight target based on current holdings</p>
                                </Card.Header>
                                <Card.Body>
                                    {rebalanceSuggestions.length > 0 ? (
                                        <>
                                            <p className="text-muted" style={{ marginBottom: '12px' }}>
                                                Largest position concentration: <strong>{(highestWeight * 100).toFixed(1)}%</strong>
                                            </p>
                                            <div className="table-responsive">
                                                <Table hover>
                                                    <thead>
                                                        <tr>
                                                            <th>Stock</th>
                                                            <th>Current Weight</th>
                                                            <th>Target Weight</th>
                                                            <th>Current Value</th>
                                                            <th>Target Value</th>
                                                            <th>Action</th>
                                                            <th>Suggested Shares</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {rebalanceSuggestions.map((item) => (
                                                            <tr key={item.name}>
                                                                <td><strong>{item.name}</strong></td>
                                                                <td>{(item.currentWeight * 100).toFixed(1)}%</td>
                                                                <td>{(item.targetWeight * 100).toFixed(1)}%</td>
                                                                <td>{this.formatCurrency(item.currentValue)}</td>
                                                                <td>{this.formatCurrency(item.targetValue)}</td>
                                                                <td>
                                                                    <Badge bg={item.action === 'BUY' ? 'success' : item.action === 'SELL' ? 'warning' : 'secondary'}>
                                                                        {item.action}
                                                                    </Badge>
                                                                </td>
                                                                <td>
                                                                    {item.shares > 0 ? item.shares : '—'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center" style={{ padding: '40px' }}>
                                            <i className="pe-7s-info" style={{ fontSize: '48px', color: '#999', marginBottom: '10px', display: 'block' }}></i>
                                            <p className="text-muted">Own at least one stock to generate rebalancing suggestions</p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Top 20 Popular Stocks */}
                    <Row>
                        <Col md={12}>
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">
                                        <i className="pe-7s-star" style={{ marginRight: '8px' }}></i>
                                        Top 20 Most Popular Stocks
                                    </Card.Title>
                                    <p className="card-category">Ranked by total transaction volume</p>
                                </Card.Header>
                                <Card.Body>
                                    {popularStocks.length > 0 ? (
                                        <div className="table-responsive">
                                            <Table hover>
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Stock Name</th>
                                                        <th>Buy Count</th>
                                                        <th>Sell Count</th>
                                                        <th>Total Volume</th>
                                                        <th>Net Shares</th>
                                                        <th>Current Price</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {popularStocks.map((stock, index) => (
                                                        <tr key={stock.name}>
                                                            <td>
                                                                <strong>#{index + 1}</strong>
                                                            </td>
                                                            <td>
                                                                <strong>{stock.name}</strong>
                                                            </td>
                                                            <td>
                                                                <Badge bg="success">{stock.buyCount}</Badge>
                                                            </td>
                                                            <td>
                                                                <Badge bg="danger">{stock.sellCount}</Badge>
                                                            </td>
                                                            <td>
                                                                <strong>{this.formatCurrency(stock.totalVolume)}</strong>
                                                            </td>
                                                            <td>
                                                                <span className={stock.netShares > 0 ? 'text-success' : stock.netShares < 0 ? 'text-danger' : ''}>
                                                                    {stock.netShares > 0 ? '+' : ''}{stock.netShares}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {stock.currentValue > 0 ? this.formatCurrency(stock.currentValue) : '—'}
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm btn-info"
                                                                    onClick={() => this.loadStockHistory(stock.name)}
                                                                    disabled={loading}
                                                                >
                                                                    View History
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="text-center" style={{ padding: '40px' }}>
                                            <i className="pe-7s-info" style={{ fontSize: '48px', color: '#999', marginBottom: '10px', display: 'block' }}></i>
                                            <p className="text-muted">No stock transactions yet</p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Historical Data & Predictions */}
                    {selectedStock && (
                        <Row>
                            <Col md={12}>
                                <Card>
                                    <Card.Header>
                                        <Card.Title as="h4">
                                            <i className="pe-7s-graph3" style={{ marginRight: '8px' }}></i>
                                            Stock History & Predictions: {selectedStock}
                                        </Card.Title>
                                        <p className="card-category">Historical data and AI-powered price predictions</p>
                                        <div className="btn-group" role="group" style={{ marginTop: '10px' }}>
                                            {(['1D', '1W', '1M', '3M', '1Y'] as const).map(range => (
                                                <button
                                                    key={range}
                                                    className={`btn btn-sm ${timeRange === range ? 'btn-primary' : 'btn-outline-primary'}`}
                                                    onClick={() => {
                                                        this.setState({ timeRange: range });
                                                        this.loadStockHistory(selectedStock);
                                                    }}
                                                >
                                                    {range}
                                                </button>
                                            ))}
                                        </div>
                                    </Card.Header>
                                    <Card.Body>
                                        {loading ? (
                                            <div className="text-center" style={{ padding: '80px' }}>
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="sr-only">Loading...</span>
                                                </div>
                                                <p className="text-muted" style={{ marginTop: '10px' }}>Loading historical data...</p>
                                            </div>
                                        ) : historicalChart ? (
                                            <div style={{ height: '400px' }}>
                                                <Line 
                                                    data={historicalChart} 
                                                    options={{
                                                        ...chartOptions,
                                                        plugins: {
                                                            ...chartOptions.plugins,
                                                            tooltip: {
                                                                mode: 'index',
                                                                intersect: false,
                                                            }
                                                        }
                                                    }} 
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-center" style={{ padding: '80px' }}>
                                                <i className="pe-7s-info" style={{ fontSize: '48px', color: '#999', marginBottom: '10px', display: 'block' }}></i>
                                                <p className="text-muted">
                                                    {selectedStock
                                                        ? (historyError || 'No historical data available for this stock')
                                                        : 'Select a stock to view its history'}
                                                </p>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state: AppState) => ({
    transactions: (state as any).transactions?.transactions || [],
    stocks: getStocksByOwnedQuantity(state),
    accountValue: state.depot.accountValue
});

export default connect(mapStateToProps)(Analytics);
