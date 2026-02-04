import * as React from 'react';
import { connect } from 'react-redux';
import { Card, Row, Col, Table, Badge } from 'react-bootstrap';
import { AppState, Stock } from '../../state/AppState';
import { Transaction } from '../../state/transactions/transactionActions';
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
    StockHistoricalData 
} from '../../services/stockApiService';
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
}

interface AnalyticsState {
    selectedStock: string | null;
    historicalData: StockHistoricalData | null;
    prediction: any | null;
    loading: boolean;
    timeRange: '1D' | '1W' | '1M' | '3M' | '1Y';
}

interface StockPopularity {
    name: string;
    buyCount: number;
    sellCount: number;
    totalVolume: number;
    netShares: number;
    currentValue: number;
}

class Analytics extends React.Component<AnalyticsProps, AnalyticsState> {
    constructor(props: AnalyticsProps) {
        super(props);
        this.state = {
            selectedStock: null,
            historicalData: null,
            prediction: null,
            loading: false,
            timeRange: '1M'
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

    // Load historical data for a stock
    async loadStockHistory(stockName: string) {
        this.setState({ loading: true, selectedStock: stockName });
        
        try {
            const { timeRange } = this.state;
            const historical = await fetchStockHistoricalData(stockName, timeRange);
            const prediction = await fetchStockPrediction(stockName);
            
            this.setState({
                historicalData: historical,
                prediction,
                loading: false
            });
        } catch (error) {
            console.error('Error loading stock data:', error);
            this.setState({ loading: false });
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
        const { selectedStock, loading, timeRange } = this.state;
        const popularStocks = this.getStockPopularity();
        const timelineData = this.getTransactionTimelineData();
        const portfolioData = this.getPortfolioDistribution();
        const transactionTypeData = this.getTransactionTypeDistribution();
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
                                Comprehensive view of your trading activity, popular stocks, and market predictions
                            </p>
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
                                                    {selectedStock ? 'No historical data available or API key not configured' : 'Select a stock to view its history'}
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
    stocks: state.stockMarket.stocks || []
});

export default connect(mapStateToProps)(Analytics);
