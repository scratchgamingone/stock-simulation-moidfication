import * as React from 'react';
import { AppState, Stock } from '../../state/AppState';
import { connect } from 'react-redux';
import { Col, Container, Row } from 'react-bootstrap';
import { addCustomStock, buyOrSellStock, deleteCustomStock } from '../../state/stockMarket/stockMarketActions';
import { earnMoney, buyUpgrade } from '../../state/upgrades/upgradesActions';
import { getUpgrades, getTotalEarningsMultiplier } from '../../state/upgrades/upgradesSelector';
import StockmarketCard from './StockmarketCard';
import { AddStockCard } from './AddStockCard';
import EarnMoneyCard from './EarnMoneyCard/EarnMoneyCard';
import UpgradesShop from './UpgradesShop/UpgradesShop';
import { Upgrade } from '../../state/upgrades/upgradesActions';

interface MarketProps {
    stocks: Stock[];
    upgrades: Upgrade[];
    accountValue: number;
    earningsMultiplier: number;
    buy: ( stock: string, amount: number ) => void;
    sell: ( stock: string, amount: number ) => void;
    addStock: ( symbol: string, name: string, initialPrice: number ) => void;
    deleteStock: ( stockName: string ) => void;
    earnMoney: () => void;
    buyUpgrade: ( upgradeId: string ) => void;
}

interface MarketState {
}

class Market extends React.Component<MarketProps, MarketState> {

    constructor( props: MarketProps ) {
        super( props );
        console.log('[MARKET] Constructor - props:', props);
    }

    render() {
        const {stocks, buy, sell, addStock, deleteStock, earnMoney, buyUpgrade, upgrades, accountValue, earningsMultiplier} = this.props;
        console.log('[MARKET] Render - stocks count:', stocks.length, 'buy function:', typeof buy, 'sell function:', typeof sell);

        return (
            <div className="content">
                <Container fluid={true}>
                    <Row>
                        <Col lg={6} xs={12}>
                            <EarnMoneyCard 
                                onEarnMoney={earnMoney}
                                multiplier={earningsMultiplier}
                            />
                        </Col>
                        <Col lg={6} xs={12}>
                            <UpgradesShop 
                                upgrades={upgrades}
                                accountValue={accountValue}
                                onBuyUpgrade={buyUpgrade}
                            />
                        </Col>
                    </Row>
                    <Row style={{ marginTop: '20px' }}>
                        <Col xs={12}>
                            <AddStockCard 
                                onAddStock={addStock}
                                customStocks={stocks}
                                onDeleteStock={deleteStock}
                            />
                        </Col>
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
    upgrades: getUpgrades(state),
    accountValue: state.depot.accountValue,
    earningsMultiplier: getTotalEarningsMultiplier(state)
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
    addStock: ( symbol: string, name: string, initialPrice: number ) => {
        dispatch( addCustomStock( symbol, name, initialPrice ) );
    },
    deleteStock: ( stockName: string ) => {
        dispatch( deleteCustomStock( stockName ) );
    },
    earnMoney: () => {
        dispatch( earnMoney() );
    },
    buyUpgrade: ( upgradeId: string ) => {
        dispatch( buyUpgrade( upgradeId ) );
    }
});

export default connect( mapStateToProps, mapDispatchToProps )( Market );
