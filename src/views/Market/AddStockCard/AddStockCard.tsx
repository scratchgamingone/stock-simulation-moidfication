import * as React from 'react';
import { Button, Col, Form, Row, Alert, Spinner, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import { Stock } from '../../../state/AppState';

interface AddStockCardProps {
    onAddStock: (symbol: string, name: string, initialPrice: number) => void;
    customStocks?: Stock[];
    onDeleteStock?: (stockName: string) => void;
}

interface AddStockCardState {
    symbol: string;
    showForm: boolean;
    loading: boolean;
    error: string;
    confirmDeleteStock?: string; // Stock name to delete
    showDeleteAllConfirm: boolean;
}

class AddStockCard extends React.Component<AddStockCardProps, AddStockCardState> {
    constructor(props: AddStockCardProps) {
        super(props);
        this.state = {
            symbol: '',
            showForm: false,
            loading: false,
            error: '',
            confirmDeleteStock: undefined,
            showDeleteAllConfirm: false
        };
    }

    handleSubmit = async (e: any) => {
        e.preventDefault();
        const { symbol } = this.state;
        
        if (!symbol.trim()) {
            this.setState({ error: 'Please enter a stock ticker symbol' });
            return;
        }

        this.setState({ loading: true, error: '' });

        const ticker = symbol.trim().toUpperCase();
        let price = 100; // Default fallback price

        try {
            // Try Yahoo Finance API with CORS proxy
            const proxyUrl = 'https://corsproxy.io/?';
            const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
            
            const response = await axios.get(proxyUrl + encodeURIComponent(apiUrl), { 
                timeout: 8000 
            });
            
            if (response.data?.chart?.result?.[0]?.meta?.regularMarketPrice) {
                const fetchedPrice = response.data.chart.result[0].meta.regularMarketPrice;
                
                if (fetchedPrice && !isNaN(fetchedPrice) && fetchedPrice > 0) {
                    price = fetchedPrice;
                }
            }
        } catch (err) {
            console.log('API fetch failed, using default price:', err);
            // Continue with default price
        }

        // Add stock with either fetched or default price
        this.props.onAddStock(ticker, ticker, price);
        
        // Reset form
        this.setState({
            symbol: '',
            showForm: false,
            loading: false,
            error: ''
        });
    };

    toggleForm = () => {
        this.setState({ showForm: !this.state.showForm });
    };

    handleAddRandomStock = async () => {
        this.setState({ loading: true, error: '' });

        let randomTicker = '';
        let price = 100; // Default fallback price

        try {
            // Fetch list of stock symbols from public API
            const proxyUrl = 'https://corsproxy.io/?';
            
            // Use Yahoo Finance screener endpoint to get random stocks
            const screenerUrl = 'https://query2.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=true&scrIds=most_actives&count=100';
            
            const screenerResponse = await axios.get(proxyUrl + encodeURIComponent(screenerUrl), { 
                timeout: 10000 
            });
            
            // Extract ticker symbols from response
            const quotes = screenerResponse.data?.finance?.result?.[0]?.quotes || [];
            
            if (quotes.length > 0) {
                // Pick a random stock from the fetched list
                const randomStock = quotes[Math.floor(Math.random() * quotes.length)];
                randomTicker = randomStock.symbol;
                
                // Try to get the current price from the screener data
                if (randomStock.regularMarketPrice && !isNaN(randomStock.regularMarketPrice) && randomStock.regularMarketPrice > 0) {
                    price = randomStock.regularMarketPrice;
                }
            } else {
                throw new Error('No stocks returned from API');
            }
        } catch (err) {
            console.log('Failed to fetch random stock from API:', err);
            this.setState({ 
                loading: false, 
                error: 'Failed to fetch random stock. Please try again or add manually.' 
            });
            return;
        }

        // Add the random stock with real price
        this.props.onAddStock(randomTicker, randomTicker, price);
        
        this.setState({ loading: false, error: '' });
    };

    handleDeleteStock = (stockName: string) => {
        this.setState({ confirmDeleteStock: stockName });
    };

    handleConfirmDeleteStock = (stockName: string) => {
        const { onDeleteStock } = this.props;
        if (onDeleteStock) {
            onDeleteStock(stockName);
        }
        this.setState({ confirmDeleteStock: undefined });
    };

    handleCancelDeleteStock = () => {
        this.setState({ confirmDeleteStock: undefined });
    };

    handleShowDeleteAllConfirm = () => {
        this.setState({ showDeleteAllConfirm: true });
    };

    handleConfirmDeleteAll = () => {
        const { customStocks, onDeleteStock } = this.props;
        if (customStocks && onDeleteStock) {
            customStocks.forEach(stock => {
                onDeleteStock(stock.name);
            });
        }
        this.setState({ showDeleteAllConfirm: false });
    };

    handleCancelDeleteAll = () => {
        this.setState({ showDeleteAllConfirm: false });
    };

    render() {
        const { symbol, showForm, loading, error, confirmDeleteStock, showDeleteAllConfirm } = this.state;
        const { customStocks } = this.props;
        
        const allStocks = customStocks || [];

        return (
            <div className={'card'}>
                <div className="content">
                <div style={{ padding: '20px' }}>
                    <h4 className="title" style={{ marginBottom: '20px' }}>
                        <i className="pe-7s-plus" style={{ marginRight: '10px' }}></i>
                        Stock Management
                    </h4>

                    {/* All Stocks List */}
                    {allStocks.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <h6 style={{ marginBottom: '10px', color: '#666' }}>
                                All Stocks ({allStocks.length})
                            </h6>
                            <ListGroup style={{ marginBottom: '15px' }}>
                                {allStocks.map(stock => {
                                    const displayPrice = stock.value ? stock.value.toFixed(2) : '0.00';
                                    const displayQuantity = stock.quantity ? stock.quantity : 0;
                                    
                                    return (
                                        <ListGroup.Item 
                                            key={stock.name}
                                            style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div>
                                                <strong>{stock.name}</strong>
                                                <br/>
                                                <small style={{ color: '#666' }}>
                                                    Price: ${displayPrice} | Quantity: {displayQuantity} {stock.custom && <span style={{ color: '#d9534f' }}>● Custom</span>}
                                                </small>
                                            </div>
                                            <Button 
                                                variant="danger" 
                                                size="sm"
                                                onClick={() => this.handleDeleteStock(stock.name)}
                                                disabled={confirmDeleteStock === stock.name}
                                                title="Delete this stock"
                                            >
                                                <i className="pe-7s-trash"></i>
                                            </Button>
                                        </ListGroup.Item>
                                    );
                                })}
                            </ListGroup>
                            
                            {/* Delete All Button */}
                            {allStocks.length > 1 && (
                                <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={this.handleShowDeleteAllConfirm}
                                    style={{ width: '100%', marginBottom: '15px' }}
                                >
                                    <i className="pe-7s-trash" style={{ marginRight: '5px' }}></i>
                                    Delete All Custom Stocks
                                </Button>
                            )}

                            {/* Confirm Delete All */}
                            {showDeleteAllConfirm && (
                                <div style={{ 
                                    padding: '15px', 
                                    backgroundColor: '#f8d7da', 
                                    borderRadius: '4px',
                                    marginBottom: '15px',
                                    border: '1px solid #f5c6cb'
                                }}>
                                    <p style={{ margin: '0 0 10px 0', color: '#721c24', fontSize: '14px' }}>
                                        <strong>Delete all {allStocks.length} stocks?</strong>
                                    </p>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Button 
                                            variant="danger" 
                                            size="sm"
                                            onClick={this.handleConfirmDeleteAll}
                                            style={{ flex: 1 }}
                                        >
                                            Delete All
                                        </Button>
                                        <Button 
                                            variant="secondary" 
                                            size="sm"
                                            onClick={this.handleCancelDeleteAll}
                                            style={{ flex: 1 }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Confirm Delete Individual Stock */}
                            {confirmDeleteStock && (
                                <div style={{ 
                                    padding: '15px', 
                                    backgroundColor: '#f8d7da', 
                                    borderRadius: '4px',
                                    marginBottom: '15px',
                                    border: '1px solid #f5c6cb'
                                }}>
                                    <p style={{ margin: '0 0 10px 0', color: '#721c24', fontSize: '14px' }}>
                                        <strong>Delete {confirmDeleteStock}?</strong>
                                    </p>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Button 
                                            variant="danger" 
                                            size="sm"
                                            onClick={() => this.handleConfirmDeleteStock(confirmDeleteStock)}
                                            style={{ flex: 1 }}
                                        >
                                            Delete
                                        </Button>
                                        <Button 
                                            variant="secondary" 
                                            size="sm"
                                            onClick={this.handleCancelDeleteStock}
                                            style={{ flex: 1 }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <hr />
                        </div>
                    )}

                    {!showForm ? (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: '#666', marginBottom: '20px' }}>
                                Add real stocks by ticker symbol (e.g., AAPL, TSLA, MSFT)
                            </p>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <Button variant="primary" onClick={this.toggleForm} disabled={loading}>
                                    <i className="pe-7s-plus" style={{ marginRight: '5px' }}></i>
                                    Add Stock
                                </Button>
                                <Button variant="info" onClick={this.handleAddRandomStock} disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Spinner
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                role="status"
                                                aria-hidden="true"
                                                style={{ marginRight: '5px' }}
                                            />
                                            Fetching...
                                        </>
                                    ) : (
                                        <>
                                            <i className="pe-7s-refresh" style={{ marginRight: '5px' }}></i>
                                            Add Random Stock
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Form onSubmit={this.handleSubmit}>
                            {error && (
                                <Alert variant="danger" dismissible onClose={() => this.setState({ error: '' })}>
                                    {error}
                                </Alert>
                            )}
                            
                            <Form.Group as={Row} style={{ marginBottom: '15px' }}>
                                <Form.Label column sm={4}>Stock Ticker</Form.Label>
                                <Col sm={8}>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g., RBLX, AAPL, TSLA"
                                        value={symbol}
                                        onChange={(e) => this.setState({ symbol: e.target.value, error: '' })}
                                        required
                                        maxLength={10}
                                        style={{ textTransform: 'uppercase' }}
                                        disabled={loading}
                                    />
                                    <Form.Text className="text-muted">
                                        Enter the stock ticker symbol. Price will be fetched automatically.
                                    </Form.Text>
                                </Col>
                            </Form.Group>

                            <div style={{ textAlign: 'right' }}>
                                <Button 
                                    variant="secondary" 
                                    onClick={this.toggleForm}
                                    style={{ marginRight: '10px' }}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button variant="success" type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Spinner
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                role="status"
                                                aria-hidden="true"
                                                style={{ marginRight: '5px' }}
                                            />
                                            Fetching...
                                        </>
                                    ) : (
                                        <>
                                            <i className="pe-7s-check" style={{ marginRight: '5px' }}></i>
                                            Add Stock
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Form>
                    )}
                </div>
                </div>
            </div>
        );
    }
}

export default AddStockCard;
