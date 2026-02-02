import * as React from 'react';
import { Card } from '../../../components/Card/Card';
import { Stock } from '../../../state/AppState';
import { StockConfig } from '../../../state/Config';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { StockDetails } from './StockDetails';
import { BuyOrSellView } from './BuyOrSellView';
import FinancialDevelopmentChart from '../../../components/Charts/FinancialDevelopmentChart';

interface StockCardProps {
    stock: Stock;
    onBuy: (amount: number) => void;
    onSell: (amount: number) => void;
    onDelete?: (stockName: string) => void;
    accountBalance?: number;
}

interface StockCardState {
    showDeleteConfirm: boolean;
}

export default class StockmarketCard extends React.Component<StockCardProps, StockCardState> {

    constructor(props: StockCardProps) {
        super(props);
        this.state = {
            showDeleteConfirm: false
        };
    }

    handleDeleteClick = () => {
        this.setState({ showDeleteConfirm: true });
    };

    handleConfirmDelete = () => {
        const { stock, onDelete } = this.props;
        if (onDelete) {
            onDelete(stock.name);
        }
        this.setState({ showDeleteConfirm: false });
    };

    handleCancelDelete = () => {
        this.setState({ showDeleteConfirm: false });
    };

    render() {
        const {stock, onBuy, onSell} = this.props;
        const { showDeleteConfirm } = this.state;
        const isCustomStock = stock.custom === true;

        // TODO: improve performance

        return (
            <Card noHeader={true} noFooter={true}>
                <Container fluid={true}>
                    <Row>
                        <Col xs={12} sm={{ span: 8, order: 2 }} lg={{ span: 9, order: 2 }} style={{paddingLeft: 0}}>
                            <FinancialDevelopmentChart
                                valueHistory={stock.valueHistory}
                                interval={StockConfig.points() / 6}
                            />
                        </Col>
                        <Col xs={12} sm={{ span: 4, order: 1 }} lg={{ span: 3, order: 1 }} style={{paddingRight: 0}}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 className="title text-underline">{stock.name}</h4>
                                {isCustomStock && (
                                    <Button 
                                        variant="danger" 
                                        size="sm"
                                        onClick={this.handleDeleteClick}
                                        title="Delete this custom stock"
                                    >
                                        <i className="pe-7s-trash"></i>
                                    </Button>
                                )}
                            </div>
                            <br/>
                            
                            {showDeleteConfirm && (
                                <div style={{ 
                                    padding: '15px', 
                                    backgroundColor: '#f8d7da', 
                                    borderRadius: '4px',
                                    marginBottom: '15px',
                                    border: '1px solid #f5c6cb'
                                }}>
                                    <p style={{ margin: '0 0 10px 0', color: '#721c24', fontSize: '14px' }}>
                                        <strong>Delete {stock.name}?</strong>
                                    </p>
                                    <p style={{ margin: '0 0 15px 0', color: '#721c24', fontSize: '13px' }}>
                                        {stock.quantity > 0 
                                            ? `You own ${stock.quantity} shares. You'll be refunded $${(stock.value * stock.quantity).toFixed(2)}.`
                                            : 'This stock will be permanently removed.'}
                                    </p>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Button 
                                            variant="danger" 
                                            size="sm"
                                            onClick={this.handleConfirmDelete}
                                            style={{ flex: 1 }}
                                        >
                                            Delete
                                        </Button>
                                        <Button 
                                            variant="secondary" 
                                            size="sm"
                                            onClick={this.handleCancelDelete}
                                            style={{ flex: 1 }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                            
                            <StockDetails stock={stock}/>
                            <br/>
                            <BuyOrSellView 
                                onBuy={onBuy} 
                                onSell={onSell}
                                stockPrice={stock.value}
                                stockQuantity={stock.quantity}
                                accountBalance={this.props.accountBalance}
                            />
                        </Col>
                    </Row>
                </Container>
            </Card>
        );
    }
}