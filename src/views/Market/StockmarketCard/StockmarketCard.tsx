import * as React from 'react';
import { Card } from '../../../components/Card/Card';
import { AlertEvent, AlertRule, OrderRule, Stock } from '../../../state/AppState';
import { StockConfig } from '../../../state/Config';
import { Button, Container, Row, Col, Form, Badge } from 'react-bootstrap';
import { StockDetails } from './StockDetails';
import { BuyOrSellView } from './BuyOrSellView';
import FinancialDevelopmentChart from '../../../components/Charts/FinancialDevelopmentChart';

interface StockCardProps {
    stock: Stock;
    onBuy: (amount: number) => void;
    onSell: (amount: number) => void;
    onDelete?: (stockName: string) => void;
    orderRules: OrderRule[];
    alertRules: AlertRule[];
    alertEvents: AlertEvent[];
    onAddOrderRule: (stockName: string, type: 'STOP_LOSS' | 'TAKE_PROFIT', triggerPrice: number, quantity?: number) => void;
    onRemoveOrderRule: (id: string) => void;
    onAddAlertRule: (stockName: string, type: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'VALUE_CHANGE_ABOVE' | 'VALUE_CHANGE_BELOW', threshold: number) => void;
    onRemoveAlertRule: (id: string) => void;
    accountBalance?: number;
}

interface StockCardState {
    showDeleteConfirm: boolean;
    stopLossPrice: string;
    stopLossQty: string;
    takeProfitPrice: string;
    takeProfitQty: string;
    alertType: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'VALUE_CHANGE_ABOVE' | 'VALUE_CHANGE_BELOW';
    alertThreshold: string;
}

export default class StockmarketCard extends React.Component<StockCardProps, StockCardState> {

    constructor(props: StockCardProps) {
        super(props);
        this.state = {
            showDeleteConfirm: false,
            stopLossPrice: '',
            stopLossQty: '',
            takeProfitPrice: '',
            takeProfitQty: '',
            alertType: 'PRICE_ABOVE',
            alertThreshold: ''
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

    addStopLossRule = () => {
        const { stock, onAddOrderRule } = this.props;
        const triggerPrice = Number(this.state.stopLossPrice);
        const quantity = Number(this.state.stopLossQty);

        if (!Number.isFinite(triggerPrice) || triggerPrice <= 0) {
            return;
        }

        onAddOrderRule(
            stock.name,
            'STOP_LOSS',
            triggerPrice,
            Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : undefined
        );

        this.setState({ stopLossPrice: '', stopLossQty: '' });
    };

    addTakeProfitRule = () => {
        const { stock, onAddOrderRule } = this.props;
        const triggerPrice = Number(this.state.takeProfitPrice);
        const quantity = Number(this.state.takeProfitQty);

        if (!Number.isFinite(triggerPrice) || triggerPrice <= 0) {
            return;
        }

        onAddOrderRule(
            stock.name,
            'TAKE_PROFIT',
            triggerPrice,
            Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : undefined
        );

        this.setState({ takeProfitPrice: '', takeProfitQty: '' });
    };

    addAlertRule = () => {
        const { stock, onAddAlertRule } = this.props;
        const threshold = Number(this.state.alertThreshold);

        if (!Number.isFinite(threshold)) {
            return;
        }

        onAddAlertRule(stock.name, this.state.alertType, threshold);
        this.setState({ alertThreshold: '' });
    };

    render() {
        const {stock, onBuy, onSell, orderRules, alertRules, alertEvents, onRemoveOrderRule, onRemoveAlertRule} = this.props;
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
                            <br />
                            <div style={{ borderTop: '1px solid #efefef', paddingTop: '12px' }}>
                                <h6 style={{ marginTop: 0 }}>Risk Controls</h6>
                                <Form.Group style={{ marginBottom: '8px' }}>
                                    <Form.Label style={{ fontSize: '12px' }}>Stop-loss trigger price</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={this.state.stopLossPrice}
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => this.setState({ stopLossPrice: event.target.value })}
                                        placeholder="e.g. 120"
                                    />
                                    <Form.Control
                                        type="number"
                                        value={this.state.stopLossQty}
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => this.setState({ stopLossQty: event.target.value })}
                                        placeholder="quantity (optional, default all)"
                                        style={{ marginTop: '6px' }}
                                    />
                                    <Button size="sm" variant="outline-danger" onClick={this.addStopLossRule} style={{ marginTop: '8px' }}>
                                        Add Stop-Loss
                                    </Button>
                                </Form.Group>

                                <Form.Group style={{ marginBottom: '8px' }}>
                                    <Form.Label style={{ fontSize: '12px' }}>Take-profit trigger price</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={this.state.takeProfitPrice}
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => this.setState({ takeProfitPrice: event.target.value })}
                                        placeholder="e.g. 200"
                                    />
                                    <Form.Control
                                        type="number"
                                        value={this.state.takeProfitQty}
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => this.setState({ takeProfitQty: event.target.value })}
                                        placeholder="quantity (optional, default all)"
                                        style={{ marginTop: '6px' }}
                                    />
                                    <Button size="sm" variant="outline-success" onClick={this.addTakeProfitRule} style={{ marginTop: '8px' }}>
                                        Add Take-Profit
                                    </Button>
                                </Form.Group>

                                <Form.Group style={{ marginBottom: '10px' }}>
                                    <Form.Label style={{ fontSize: '12px' }}>Alert rule</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={this.state.alertType}
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => this.setState({ alertType: event.target.value as any })}
                                    >
                                        <option value="PRICE_ABOVE">Price above</option>
                                        <option value="PRICE_BELOW">Price below</option>
                                        <option value="VALUE_CHANGE_ABOVE">Value change above %</option>
                                        <option value="VALUE_CHANGE_BELOW">Value change below %</option>
                                    </Form.Control>
                                    <Form.Control
                                        type="number"
                                        value={this.state.alertThreshold}
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => this.setState({ alertThreshold: event.target.value })}
                                        placeholder="threshold"
                                        style={{ marginTop: '6px' }}
                                    />
                                    <Button size="sm" variant="outline-primary" onClick={this.addAlertRule} style={{ marginTop: '8px' }}>
                                        Add Alert
                                    </Button>
                                </Form.Group>

                                {orderRules.length > 0 && (
                                    <div style={{ marginBottom: '8px' }}>
                                        <strong style={{ fontSize: '12px' }}>Active order rules</strong>
                                        {orderRules.map((rule) => (
                                            <div key={rule.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                                                <span style={{ fontSize: '12px' }}>{rule.type} @ {rule.triggerPrice} {rule.quantity ? `(qty ${rule.quantity})` : '(all)'}</span>
                                                <Button size="sm" variant="link" onClick={() => onRemoveOrderRule(rule.id)} style={{ padding: 0 }}>Remove</Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {alertRules.length > 0 && (
                                    <div style={{ marginBottom: '8px' }}>
                                        <strong style={{ fontSize: '12px' }}>Active alerts</strong>
                                        {alertRules.map((rule) => (
                                            <div key={rule.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                                                <span style={{ fontSize: '12px' }}>{rule.type} {rule.threshold}</span>
                                                <Button size="sm" variant="link" onClick={() => onRemoveAlertRule(rule.id)} style={{ padding: 0 }}>Remove</Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {alertEvents.length > 0 && (
                                    <div>
                                        <strong style={{ fontSize: '12px' }}>Recent alerts</strong>
                                        {alertEvents.slice(0, 3).map((event) => (
                                            <div key={event.id} style={{ marginTop: '6px' }}>
                                                <Badge bg="info">{new Date(event.createdAt).toLocaleTimeString()}</Badge>
                                                <span style={{ fontSize: '12px', marginLeft: '8px' }}>{event.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </Card>
        );
    }
}