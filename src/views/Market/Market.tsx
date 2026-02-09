import * as React from 'react';
import { AppState, Stock } from '../../state/AppState';
import { connect } from 'react-redux';
import { Col, Container, Row } from 'react-bootstrap';
import { buyOrSellStock, deleteCustomStock } from '../../state/stockMarket/stockMarketActions';
import StockmarketCard from './StockmarketCard';

interface MarketProps {
    stocks: Stock[];
    accountValue: number;
    buy: ( stock: string, amount: number ) => void;
    sell: ( stock: string, amount: number ) => void;
    deleteStock: ( stockName: string ) => void;
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
        const {stocks, buy, sell, deleteStock, accountValue} = this.props;
        console.log('[MARKET] Render - stocks count:', stocks.length, 'buy function:', typeof buy, 'sell function:', typeof sell);

        return (
            <div className="content">
                <Container fluid={true}>
                    <Row style={{ marginTop: '20px' }}>
                        {
                            stocks.map( stock => {
                                return (
                                    <Col key={stock.name} xs={12}>
                                        <StockmarketCard
                                            stock={stock}
                                            onBuy={( amount: number ) => {
                                                buy( stock.name, amount );
                                            }}
                                            onSell={( amount: number ) => {
                                                sell( stock.name, amount );
                                            }}
                                            onDelete={deleteStock}
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
    stocks: state.stockMarket.stocks,
    accountValue: state.depot.accountValue
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
    }
});

export default connect( mapStateToProps, mapDispatchToProps )( Market );
