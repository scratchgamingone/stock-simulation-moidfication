import * as React from 'react';
import { connect } from 'react-redux';
import { Card } from 'react-bootstrap';
import { AppState, Stock } from '../../state/AppState';
import { Transaction } from '../../state/transactions/transactionActions';
import './Transactions.css';

interface TransactionsProps {
    transactions: Transaction[];
    stocks: Stock[];
}

class Transactions extends React.Component<TransactionsProps> {
    
    formatDate(date: Date): string {
        const d = new Date(date);
        return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    }

    calculatePotentialEarnings(transaction: Transaction): { earnings: number; percentChange: number } | null {
        // Only calculate for BUY transactions that haven't been sold
        if (transaction.type !== 'BUY') {
            return null;
        }

        const { stocks } = this.props;
        const stock = stocks.find(s => s.name === transaction.stockName);
        
        if (!stock) {
            return null; // Stock no longer exists
        }

        const currentValue = stock.value * transaction.quantity;
        const earnings = currentValue - transaction.totalValue;
        const percentChange = (earnings / transaction.totalValue) * 100;

        return { earnings, percentChange };
    }

    calculateRealizedEarnings(transaction: Transaction): { earnings: number; percentChange: number } | null {
        // Only calculate for SELL transactions
        if (transaction.type !== 'SELL') {
            return null;
        }

        const { transactions } = this.props;
        
        // Find matching BUY transactions for this stock before this sell
        const buyTransactions = transactions.filter(
            t => t.type === 'BUY' && t.stockName === transaction.stockName && 
            new Date(t.timestamp) < new Date(transaction.timestamp)
        );

        if (buyTransactions.length === 0) {
            return null;
        }

        // Calculate weighted average buy price
        let totalBuyQuantity = 0;
        let totalBuyValue = 0;
        
        buyTransactions.forEach(buy => {
            totalBuyQuantity += buy.quantity;
            totalBuyValue += buy.totalValue;
        });

        if (totalBuyQuantity === 0) {
            return null;
        }

        const avgBuyPrice = totalBuyValue / totalBuyQuantity;
        const costBasis = avgBuyPrice * transaction.quantity;
        const earnings = transaction.totalValue - costBasis;
        const percentChange = (earnings / costBasis) * 100;

        return { earnings, percentChange };
    }

    calculateTotalPotentialEarnings(): number {
        const { transactions } = this.props;
        let total = 0;

        transactions.forEach(transaction => {
            const potential = this.calculatePotentialEarnings(transaction);
            if (potential) {
                total += potential.earnings;
            }
        });

        return total;
    }

    calculateTotalRealizedEarnings(): number {
        const { transactions } = this.props;
        let total = 0;

        transactions.forEach(transaction => {
            const realized = this.calculateRealizedEarnings(transaction);
            if (realized) {
                total += realized.earnings;
            }
        });

        return total;
    }

    render() {
        const { transactions } = this.props;

        return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">
                                        <i className="pe-7s-news-paper" style={{ marginRight: '10px' }}></i>
                                        Transaction History
                                    </Card.Title>
                                    <p className="card-category">
                                        Complete history of all buy and sell transactions with earnings tracking
                                    </p>
                                </Card.Header>
                                <Card.Body>
                                    {transactions.length === 0 ? (
                                        <div className="text-center" style={{ padding: '40px', color: '#999' }}>
                                            <i className="pe-7s-info" style={{ fontSize: '48px', display: 'block', marginBottom: '20px' }}></i>
                                            <h5>No transactions yet</h5>
                                            <p>Buy or sell stocks to see your transaction history here.</p>
                                        </div>
                                    ) : (
                                        <div className="transaction-list">
                                            <div className="transaction-stats" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f4f4f4', borderRadius: '4px' }}>
                                                <div className="row">
                                                    <div className="col-md-2">
                                                        <strong>Total Transactions:</strong> {transactions.length}
                                                    </div>
                                                    <div className="col-md-2">
                                                        <strong>Buys:</strong> {transactions.filter(t => t.type === 'BUY').length}
                                                    </div>
                                                    <div className="col-md-2">
                                                        <strong>Sells:</strong> {transactions.filter(t => t.type === 'SELL').length}
                                                    </div>
                                                    <div className="col-md-3">
                                                        <strong>Unrealized Earnings:</strong>{' '}
                                                        <span className={this.calculateTotalPotentialEarnings() >= 0 ? 'text-success' : 'text-danger'} style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                                            {this.formatCurrency(this.calculateTotalPotentialEarnings())}
                                                        </span>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <strong>Realized Earnings:</strong>{' '}
                                                        <span className={this.calculateTotalRealizedEarnings() >= 0 ? 'text-success' : 'text-danger'} style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                                            {this.formatCurrency(this.calculateTotalRealizedEarnings())}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>Date & Time</th>
                                                            <th>Type</th>
                                                            <th>Stock</th>
                                                            <th className="text-right">Quantity</th>
                                                            <th className="text-right">Price/Share</th>
                                                            <th className="text-right">Total Value</th>
                                                            <th className="text-right">Earnings</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {transactions.map((transaction) => {
                                                            const potential = this.calculatePotentialEarnings(transaction);
                                                            const realized = this.calculateRealizedEarnings(transaction);
                                                            return (
                                                                <tr key={transaction.id}>
                                                                    <td>{this.formatDate(transaction.timestamp)}</td>
                                                                    <td>
                                                                        <span className={`badge ${transaction.type === 'BUY' ? 'badge-success' : 'badge-danger'}`}>
                                                                            {transaction.type}
                                                                        </span>
                                                                    </td>
                                                                    <td><strong>{transaction.stockName}</strong></td>
                                                                    <td className="text-right">{transaction.quantity}</td>
                                                                    <td className="text-right">{this.formatCurrency(transaction.pricePerShare)}</td>
                                                                    <td className="text-right">
                                                                        <strong className={transaction.type === 'BUY' ? 'text-danger' : 'text-success'}>
                                                                            {transaction.type === 'BUY' ? '-' : '+'}{this.formatCurrency(transaction.totalValue)}
                                                                        </strong>
                                                                    </td>
                                                                    <td className="text-right">
                                                                        {potential ? (
                                                                            <div>
                                                                                <strong className={potential.earnings >= 0 ? 'text-success' : 'text-danger'}>
                                                                                    {potential.earnings >= 0 ? '+' : ''}{this.formatCurrency(potential.earnings)}
                                                                                </strong>
                                                                                <br/>
                                                                                <small className={potential.percentChange >= 0 ? 'text-success' : 'text-danger'}>
                                                                                    ({potential.percentChange >= 0 ? '+' : ''}{potential.percentChange.toFixed(2)}%)
                                                                                </small>
                                                                                <br/>
                                                                                <small style={{ color: '#999' }}>Unrealized</small>
                                                                            </div>
                                                                        ) : realized ? (
                                                                            <div>
                                                                                <strong className={realized.earnings >= 0 ? 'text-success' : 'text-danger'}>
                                                                                    {realized.earnings >= 0 ? '+' : ''}{this.formatCurrency(realized.earnings)}
                                                                                </strong>
                                                                                <br/>
                                                                                <small className={realized.percentChange >= 0 ? 'text-success' : 'text-danger'}>
                                                                                    ({realized.percentChange >= 0 ? '+' : ''}{realized.percentChange.toFixed(2)}%)
                                                                                </small>
                                                                                <br/>
                                                                                <small style={{ color: '#999' }}>Realized</small>
                                                                            </div>
                                                                        ) : (
                                                                            <span style={{ color: '#999' }}>—</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state: AppState) => ({
    transactions: (state as any).transactions?.transactions || [],
    stocks: state.stockMarket.stocks || []
});

export default connect(mapStateToProps)(Transactions);
