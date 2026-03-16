import * as React from 'react';
import { AlertEvent, AlertRule, AppState, OrderRule, Stock } from '../../state/AppState';
import { connect } from 'react-redux';
import { Col, Container, Row } from 'react-bootstrap';
import { buyOrSellStock, deleteCustomStock } from '../../state/stockMarket/stockMarketActions';
import { addAlertRule, clearAlertEvents, removeAlertRule } from '../../state/alerts/alertsActions';
import { removeOrderRule, addOrderRule } from '../../state/orders/ordersActions';
import { getAlertEvents, getAlertRules } from '../../state/alerts/alertsSelector';
import { getOrderRules } from '../../state/orders/ordersSelector';
import { getStocksByOwnedQuantity } from '../../state/stockMarket/stockSelector';
import StockmarketCard from './StockmarketCard';

interface MarketProps {
    stocks: Stock[];
    orderRules: OrderRule[];
    alertRules: AlertRule[];
    alertEvents: AlertEvent[];
    accountValue: number;
    buy: ( stock: string, amount: number ) => void;
    sell: ( stock: string, amount: number ) => void;
    deleteStock: ( stockName: string ) => void;
    addOrderRule: (stockName: string, type: 'STOP_LOSS' | 'TAKE_PROFIT', triggerPrice: number, quantity?: number) => void;
    removeOrderRule: (id: string) => void;
    addAlertRule: (stockName: string, type: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'VALUE_CHANGE_ABOVE' | 'VALUE_CHANGE_BELOW', threshold: number) => void;
    removeAlertRule: (id: string) => void;
    clearAlertEvents: () => void;
}

interface MarketState {
}

class Market extends React.Component<MarketProps, MarketState> {

    constructor( props: MarketProps ) {
        super( props );
        console.log('[MARKET] Constructor - props:', props);
        this.state = {};
    }

    render() {
        const {
            stocks,
            orderRules,
            alertRules,
            alertEvents,
            buy,
            sell,
            deleteStock,
            accountValue,
            addOrderRule,
            removeOrderRule,
            addAlertRule,
            removeAlertRule,
            clearAlertEvents
        } = this.props;
        console.log('[MARKET] Render - stocks count:', stocks.length, 'buy function:', typeof buy, 'sell function:', typeof sell);

        return (
            <div className="content">
                <Container fluid={true}>
                    {alertEvents.length > 0 && (
                        <Row>
                            <Col xs={12}>
                                <div style={{ marginTop: '12px', marginBottom: '4px' }}>
                                    <button className="btn btn-sm btn-default" onClick={clearAlertEvents}>Clear Alert Center</button>
                                    <span style={{ marginLeft: '10px', color: '#6c757d' }}>{alertEvents.length} alert event(s)</span>
                                </div>
                            </Col>
                        </Row>
                    )}
                    <Row style={{ marginTop: '20px' }}>
                        {
                            stocks.map( stock => {
                                const stockOrderRules = orderRules.filter((rule) => rule.stockName === stock.name && rule.isActive);
                                const stockAlertRules = alertRules.filter((rule) => rule.stockName === stock.name && rule.isActive);
                                const stockAlertEvents = alertEvents.filter((event) => event.stockName === stock.name);

                                return (
                                    <Col key={stock.name} xs={12}>
                                        <StockmarketCard
                                            stock={stock}
                                            orderRules={stockOrderRules}
                                            alertRules={stockAlertRules}
                                            alertEvents={stockAlertEvents}
                                            onBuy={( amount: number ) => {
                                                buy( stock.name, amount );
                                            }}
                                            onSell={( amount: number ) => {
                                                sell( stock.name, amount );
                                            }}
                                            onDelete={deleteStock}
                                            onAddOrderRule={addOrderRule}
                                            onRemoveOrderRule={removeOrderRule}
                                            onAddAlertRule={addAlertRule}
                                            onRemoveAlertRule={removeAlertRule}
                                            accountBalance={accountValue}
                                        />
                                    </Col>
                                );
                            } )

                        }
                    </Row>
                </Container>
            </div>
        );
    }
}

const mapStateToProps = ( state: AppState ) => ({
    stocks: getStocksByOwnedQuantity(state),
    accountValue: state.depot.accountValue,
    orderRules: getOrderRules(state),
    alertRules: getAlertRules(state),
    alertEvents: getAlertEvents(state)
});

// tslint:disable-next-line: no-any
const mapDispatchToProps = ( dispatch: any ) => ({
    buy: ( stock: string, amount: number ) => {
        if (Number.isInteger( amount )) {
            dispatch( buyOrSellStock( stock, amount ) );
        }
    },
    sell: ( stock: string, amount: number ) => {
        if (Number.isInteger( amount )) {
            dispatch( buyOrSellStock( stock, -amount ) );
        }
    },
    deleteStock: ( stockName: string ) => {
        dispatch( deleteCustomStock( stockName ) );
    },
    addOrderRule: (stockName: string, type: 'STOP_LOSS' | 'TAKE_PROFIT', triggerPrice: number, quantity?: number) => {
        dispatch(addOrderRule(stockName, type, triggerPrice, quantity));
    },
    removeOrderRule: (id: string) => {
        dispatch(removeOrderRule(id));
    },
    addAlertRule: (stockName: string, type: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'VALUE_CHANGE_ABOVE' | 'VALUE_CHANGE_BELOW', threshold: number) => {
        dispatch(addAlertRule(stockName, type, threshold));
    },
    removeAlertRule: (id: string) => {
        dispatch(removeAlertRule(id));
    },
    clearAlertEvents: () => {
        dispatch(clearAlertEvents());
    }
});

export default connect( mapStateToProps, mapDispatchToProps )( Market );
