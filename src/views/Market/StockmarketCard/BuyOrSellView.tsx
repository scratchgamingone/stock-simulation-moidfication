import * as React from 'react';
import { Button } from 'react-bootstrap';

interface BuyOrSellViewProps {
    onBuy: (amount: number) => void;
    onSell: (amount: number) => void;
    stockPrice?: number;
    stockQuantity?: number;
    accountBalance?: number;
}

interface BuyOrSellViewState {
    showBuyModal: boolean;
    showSellModal: boolean;
    buyAmount: number;
    sellAmount: number;
}

export class BuyOrSellView extends React.Component<BuyOrSellViewProps, BuyOrSellViewState> {

    constructor(props: BuyOrSellViewProps) {
        super(props);

        this.state = {
            showBuyModal: false,
            showSellModal: false,
            buyAmount: 1,
            sellAmount: 1
        };
    }

    getMaxCanBuy = (): number => {
        const { stockPrice, accountBalance } = this.props;
        if (stockPrice && accountBalance && stockPrice > 0) {
            const maxBuy = Math.floor(accountBalance / stockPrice);
            return Math.max(0, maxBuy);
        }
        return 0;
    };

    getMaxCanSell = (): number => {
        return this.props.stockQuantity || 0;
    };

    handleBuyClick = () => {
        console.log('Buy button clicked');
        this.setState({ showBuyModal: true, buyAmount: 1 }, () => {
            console.log('Buy modal state:', this.state.showBuyModal);
        });
    };

    handleSellClick = () => {
        console.log('Sell button clicked');
        this.setState({ showSellModal: true, sellAmount: 1 }, () => {
            console.log('Sell modal state:', this.state.showSellModal);
        });
    };

    handleConfirmBuy = () => {
        const { buyAmount } = this.state;
        if (buyAmount > 0) {
            this.props.onBuy(buyAmount);
            this.setState({ showBuyModal: false });
        }
    };

    handleConfirmSell = () => {
        const { sellAmount } = this.state;
        if (sellAmount > 0) {
            this.props.onSell(sellAmount);
            this.setState({ showSellModal: false });
        }
    };

    handleBuyMax = () => {
        const maxCanBuy = this.getMaxCanBuy();
        this.setState({ buyAmount: maxCanBuy });
    };

    handleSellAll = () => {
        const maxCanSell = this.getMaxCanSell();
        this.setState({ sellAmount: maxCanSell });
    };

    render() {
        const { showBuyModal, showSellModal, buyAmount, sellAmount } = this.state;
        const { stockPrice, stockQuantity } = this.props;
        const maxCanBuy = this.getMaxCanBuy();
        const maxCanSell = this.getMaxCanSell();

        console.log('Render - showBuyModal:', showBuyModal, 'showSellModal:', showSellModal);

        return (
            <>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <Button
                        variant="success"
                        size="sm"
                        onClick={this.handleBuyClick}
                        style={{ flex: 1 }}
                        disabled={maxCanBuy <= 0}
                    >
                        <i className="pe-7s-plus" style={{ marginRight: '5px' }}></i>
                        Buy
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={this.handleSellClick}
                        style={{ flex: 1 }}
                        disabled={stockQuantity <= 0}
                    >
                        <i className="pe-7s-minus" style={{ marginRight: '5px' }}></i>
                        Sell
                    </Button>
                </div>

                {showBuyModal && <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9998}} onClick={() => this.setState({ showBuyModal: false })} />}
                {showSellModal && <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9998}} onClick={() => this.setState({ showSellModal: false })} />}

                {/* Buy Modal - Custom Implementation */}
                {showBuyModal && (
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        zIndex: 9999,
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{ 
                            backgroundColor: '#f8f9fa', 
                            borderBottom: '2px solid #28a745',
                            padding: '20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745', margin: 0 }}>
                                <i className="pe-7s-cart" style={{ marginRight: '10px' }}></i>
                                Buy Stock
                            </h3>
                            <button 
                                onClick={() => this.setState({ showBuyModal: false })}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '30px',
                                    cursor: 'pointer',
                                    color: '#666',
                                    padding: '0',
                                    width: '30px',
                                    height: '30px',
                                    lineHeight: '30px'
                                }}
                            >×</button>
                        </div>
                        
                        {/* Body */}
                        <div style={{ padding: '30px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '18px', fontWeight: '600', display: 'block', marginBottom: '10px' }}>
                                    How many shares to buy?
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={maxCanBuy}
                                    value={buyAmount}
                                    onChange={(e) => this.setState({ buyAmount: parseInt(e.target.value) || 1 })}
                                    style={{
                                        fontSize: '20px',
                                        padding: '15px',
                                        textAlign: 'center',
                                        width: '100%',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px'
                                    }}
                                />
                                <small style={{ fontSize: '14px', color: '#6c757d', display: 'block', marginTop: '5px' }}>
                                    Max you can buy: <strong style={{ fontSize: '16px', color: '#28a745' }}>{maxCanBuy}</strong> shares
                                </small>
                            </div>
                            
                            <div style={{
                                backgroundColor: '#e8f5e9',
                                padding: '20px',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                border: '2px solid #28a745'
                            }}>
                                <p style={{ margin: '10px 0', fontSize: '16px' }}>
                                    <strong>Price per share:</strong> 
                                    <span style={{ float: 'right', color: '#28a745', fontSize: '18px' }}>
                                        ${stockPrice?.toFixed(2)}
                                    </span>
                                </p>
                                <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #28a745' }} />
                                <p style={{ margin: '10px 0', fontSize: '18px', fontWeight: 'bold' }}>
                                    <strong>Total cost:</strong> 
                                    <span style={{ float: 'right', color: '#28a745', fontSize: '22px' }}>
                                        ${(buyAmount * (stockPrice || 0)).toFixed(2)}
                                    </span>
                                </p>
                            </div>

                            <button
                                onClick={this.handleBuyMax}
                                style={{
                                    width: '100%',
                                    fontSize: '16px',
                                    padding: '12px',
                                    marginBottom: '20px',
                                    backgroundColor: '#fff',
                                    border: '2px solid #28a745',
                                    color: '#28a745',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                <i className="pe-7s-up-arrow" style={{ marginRight: '8px' }}></i>
                                Buy Maximum ({maxCanBuy})
                            </button>
                        </div>
                        
                        {/* Footer */}
                        <div style={{ 
                            padding: '20px', 
                            backgroundColor: '#f8f9fa',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            borderTop: '1px solid #dee2e6'
                        }}>
                            <button
                                onClick={() => this.setState({ showBuyModal: false })}
                                style={{
                                    fontSize: '16px',
                                    padding: '10px 30px',
                                    backgroundColor: '#6c757d',
                                    border: 'none',
                                    color: '#fff',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                <i className="pe-7s-close" style={{ marginRight: '8px' }}></i>
                                Cancel
                            </button>
                            <button
                                onClick={this.handleConfirmBuy}
                                disabled={buyAmount <= 0 || buyAmount > maxCanBuy}
                                style={{
                                    fontSize: '16px',
                                    padding: '10px 30px',
                                    backgroundColor: buyAmount <= 0 || buyAmount > maxCanBuy ? '#ccc' : '#28a745',
                                    border: 'none',
                                    color: '#fff',
                                    borderRadius: '4px',
                                    cursor: buyAmount <= 0 || buyAmount > maxCanBuy ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                <i className="pe-7s-check" style={{ marginRight: '8px' }}></i>
                                Confirm Buy
                            </button>
                        </div>
                    </div>
                )}

                {/* Sell Modal - Custom Implementation */}
                {showSellModal && (
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        zIndex: 9999,
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{ 
                            backgroundColor: '#f8f9fa', 
                            borderBottom: '2px solid #dc3545',
                            padding: '20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545', margin: 0 }}>
                                <i className="pe-7s-wallet" style={{ marginRight: '10px' }}></i>
                                Sell Stock
                            </h3>
                            <button 
                                onClick={() => this.setState({ showSellModal: false })}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '30px',
                                    cursor: 'pointer',
                                    color: '#666',
                                    padding: '0',
                                    width: '30px',
                                    height: '30px',
                                    lineHeight: '30px'
                                }}
                            >×</button>
                        </div>
                        
                        {/* Body */}
                        <div style={{ padding: '30px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '18px', fontWeight: '600', display: 'block', marginBottom: '10px' }}>
                                    How many shares to sell?
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={maxCanSell}
                                    value={sellAmount}
                                    onChange={(e) => this.setState({ sellAmount: parseInt(e.target.value) || 1 })}
                                    style={{
                                        fontSize: '20px',
                                        padding: '15px',
                                        textAlign: 'center',
                                        width: '100%',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px'
                                    }}
                                />
                                <small style={{ fontSize: '14px', color: '#6c757d', display: 'block', marginTop: '5px' }}>
                                    You own: <strong style={{ fontSize: '16px', color: '#dc3545' }}>{maxCanSell}</strong> shares
                                </small>
                            </div>
                            
                            <div style={{
                                backgroundColor: '#ffebee',
                                padding: '20px',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                border: '2px solid #dc3545'
                            }}>
                                <p style={{ margin: '10px 0', fontSize: '16px' }}>
                                    <strong>Price per share:</strong> 
                                    <span style={{ float: 'right', color: '#dc3545', fontSize: '18px' }}>
                                        ${stockPrice?.toFixed(2)}
                                    </span>
                                </p>
                                <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #dc3545' }} />
                                <p style={{ margin: '10px 0', fontSize: '18px', fontWeight: 'bold' }}>
                                    <strong>Total revenue:</strong> 
                                    <span style={{ float: 'right', color: '#dc3545', fontSize: '22px' }}>
                                        ${(sellAmount * (stockPrice || 0)).toFixed(2)}
                                    </span>
                                </p>
                            </div>

                            <button
                                onClick={this.handleSellAll}
                                style={{
                                    width: '100%',
                                    fontSize: '16px',
                                    padding: '12px',
                                    marginBottom: '20px',
                                    backgroundColor: '#fff',
                                    border: '2px solid #dc3545',
                                    color: '#dc3545',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                <i className="pe-7s-down-arrow" style={{ marginRight: '8px' }}></i>
                                Sell All ({maxCanSell})
                            </button>
                        </div>
                        
                        {/* Footer */}
                        <div style={{ 
                            padding: '20px', 
                            backgroundColor: '#f8f9fa',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            borderTop: '1px solid #dee2e6'
                        }}>
                            <button
                                onClick={() => this.setState({ showSellModal: false })}
                                style={{
                                    fontSize: '16px',
                                    padding: '10px 30px',
                                    backgroundColor: '#6c757d',
                                    border: 'none',
                                    color: '#fff',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                <i className="pe-7s-close" style={{ marginRight: '8px' }}></i>
                                Cancel
                            </button>
                            <button
                                onClick={this.handleConfirmSell}
                                disabled={sellAmount <= 0 || sellAmount > maxCanSell}
                                style={{
                                    fontSize: '16px',
                                    padding: '10px 30px',
                                    backgroundColor: sellAmount <= 0 || sellAmount > maxCanSell ? '#ccc' : '#dc3545',
                                    border: 'none',
                                    color: '#fff',
                                    borderRadius: '4px',
                                    cursor: sellAmount <= 0 || sellAmount > maxCanSell ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                <i className="pe-7s-check" style={{ marginRight: '8px' }}></i>
                                Confirm Sell
                            </button>
                        </div>
                    </div>
                )}
            </>
        );
    }
}