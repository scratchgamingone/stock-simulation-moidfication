import * as React from 'react';
import { AlertEvent, AlertRule, AppState, OrderRule, Stock } from '../../state/AppState';
import { connect } from 'react-redux';
import { Col, Container, Row } from 'react-bootstrap';
import { addNotification } from '../../components/NotificationSystem';
import { buyOrSellStock, deleteCustomStock } from '../../state/stockMarket/stockMarketActions';
import { addAlertRule, clearAlertEvents, removeAlertRule } from '../../state/alerts/alertsActions';
import { removeOrderRule, addOrderRule } from '../../state/orders/ordersActions';
import { getAlertEvents, getAlertRules } from '../../state/alerts/alertsSelector';
import { getOrderRules } from '../../state/orders/ordersSelector';
import { getStocksByOwnedQuantity } from '../../state/stockMarket/stockSelector';
import StockmarketCard from './StockmarketCard';

type RandomBuyMode = 'RANDOM' | 'CHEAPEST' | 'EXPENSIVE' | 'LOW_VOL' | 'HIGH_VOL' | 'MOMENTUM_UP' | 'DIP_BUY';

const DEFAULT_RANDOM_BUY_COOLDOWN_MS = 300;
const MIN_RANDOM_COOLDOWN_MS = 100;
const MAX_RANDOM_COOLDOWN_MS = 5000;

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
    randomBuyCoolingDown: boolean;
    randomBuyCooldownMs: number;
    randomBuyMode: RandomBuyMode;
    randomBuyDryRun: boolean;
    randomBuyUseMinPrice: boolean;
    randomBuyMinPrice: number;
    randomBuyUseMaxPrice: boolean;
    randomBuyMaxPrice: number;
    randomBuyRequirePositiveChange: boolean;
    randomBuyRequireNegativeChange: boolean;
    randomBuyRequireCustomOnly: boolean;
    randomBuyAttemptCount: number;
    randomBuySuccessCount: number;
    randomBuyFailedCount: number;
    lastRandomBoughtStock: string;
    lastRandomBoughtPrice: number;
    lastRandomActionMessage: string;
    lastRandomCandidateCount: number;
}

class Market extends React.Component<MarketProps, MarketState> {
    private randomBuyCooldownTimer: number | undefined;

    constructor( props: MarketProps ) {
        super( props );
        console.log('[MARKET] Constructor - props:', props);
        this.state = {
            randomBuyCoolingDown: false,
            randomBuyCooldownMs: DEFAULT_RANDOM_BUY_COOLDOWN_MS,
            randomBuyMode: 'RANDOM',
            randomBuyDryRun: false,
            randomBuyUseMinPrice: false,
            randomBuyMinPrice: 0,
            randomBuyUseMaxPrice: false,
            randomBuyMaxPrice: 1000,
            randomBuyRequirePositiveChange: false,
            randomBuyRequireNegativeChange: false,
            randomBuyRequireCustomOnly: false,
            randomBuyAttemptCount: 0,
            randomBuySuccessCount: 0,
            randomBuyFailedCount: 0,
            lastRandomBoughtStock: '',
            lastRandomBoughtPrice: 0,
            lastRandomActionMessage: 'Ready to random buy.',
            lastRandomCandidateCount: 0
        };
    }

    componentWillUnmount() {
        if (this.randomBuyCooldownTimer) {
            window.clearTimeout(this.randomBuyCooldownTimer);
        }
    }

    sanitizeNonNegativeNumber = (value: string, fallback: number) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) {
            return fallback;
        }

        return parsed;
    }

    clampCooldownMs = (value: number) => {
        if (value < MIN_RANDOM_COOLDOWN_MS) {
            return MIN_RANDOM_COOLDOWN_MS;
        }

        if (value > MAX_RANDOM_COOLDOWN_MS) {
            return MAX_RANDOM_COOLDOWN_MS;
        }

        return value;
    }

    setRandomBuyMode = (mode: RandomBuyMode) => {
        this.setState({ randomBuyMode: mode });
    }

    setRandomBuyCooldownMs = (ms: number) => {
        this.setState({ randomBuyCooldownMs: this.clampCooldownMs(ms) });
    }

    toggleRandomBuyDryRun = () => {
        this.setState((prevState) => ({ randomBuyDryRun: !prevState.randomBuyDryRun }));
    }

    toggleRandomBuyMinPrice = () => {
        this.setState((prevState) => ({ randomBuyUseMinPrice: !prevState.randomBuyUseMinPrice }));
    }

    toggleRandomBuyMaxPrice = () => {
        this.setState((prevState) => ({ randomBuyUseMaxPrice: !prevState.randomBuyUseMaxPrice }));
    }

    toggleRandomBuyRequirePositiveChange = () => {
        this.setState((prevState) => {
            const nextValue = !prevState.randomBuyRequirePositiveChange;
            return {
                randomBuyRequirePositiveChange: nextValue,
                randomBuyRequireNegativeChange: nextValue ? false : prevState.randomBuyRequireNegativeChange
            };
        });
    }

    toggleRandomBuyRequireNegativeChange = () => {
        this.setState((prevState) => {
            const nextValue = !prevState.randomBuyRequireNegativeChange;
            return {
                randomBuyRequireNegativeChange: nextValue,
                randomBuyRequirePositiveChange: nextValue ? false : prevState.randomBuyRequirePositiveChange
            };
        });
    }

    toggleRandomBuyRequireCustomOnly = () => {
        this.setState((prevState) => ({ randomBuyRequireCustomOnly: !prevState.randomBuyRequireCustomOnly }));
    }

    setRandomBuyMinPrice = (value: string) => {
        this.setState({ randomBuyMinPrice: this.sanitizeNonNegativeNumber(value, 0) });
    }

    setRandomBuyMaxPrice = (value: string) => {
        this.setState({ randomBuyMaxPrice: this.sanitizeNonNegativeNumber(value, 0) });
    }

    getRandomBuyModeLabel = (mode: RandomBuyMode) => {
        switch (mode) {
            case 'CHEAPEST':
                return 'Cheapest';
            case 'EXPENSIVE':
                return 'Most Expensive';
            case 'LOW_VOL':
                return 'Lowest Volatility';
            case 'HIGH_VOL':
                return 'Highest Volatility';
            case 'MOMENTUM_UP':
                return 'Best Momentum';
            case 'DIP_BUY':
                return 'Biggest Dip';
            case 'RANDOM':
            default:
                return 'Random';
        }
    }

    getModeDescription = () => {
        return this.getRandomBuyModeLabel(this.state.randomBuyMode);
    }

    hasContradictingTrendFilters = () => {
        const { randomBuyRequirePositiveChange, randomBuyRequireNegativeChange } = this.state;
        return randomBuyRequirePositiveChange && randomBuyRequireNegativeChange;
    }

    isStockWithinPriceRange = (stock: Stock) => {
        const {
            randomBuyUseMinPrice,
            randomBuyMinPrice,
            randomBuyUseMaxPrice,
            randomBuyMaxPrice
        } = this.state;

        if (randomBuyUseMinPrice && stock.value < randomBuyMinPrice) {
            return false;
        }

        if (randomBuyUseMaxPrice && stock.value > randomBuyMaxPrice) {
            return false;
        }

        return true;
    }

    matchesTrendFilter = (stock: Stock) => {
        const { randomBuyRequirePositiveChange, randomBuyRequireNegativeChange } = this.state;

        if (randomBuyRequirePositiveChange) {
            return stock.valueChange > 0;
        }

        if (randomBuyRequireNegativeChange) {
            return stock.valueChange < 0;
        }

        return true;
    }

    matchesCustomOnlyFilter = (stock: Stock) => {
        if (!this.state.randomBuyRequireCustomOnly) {
            return true;
        }

        return !!stock.custom;
    }

    matchesAllRandomFilters = (stock: Stock) => {
        return this.isStockWithinPriceRange(stock)
            && this.matchesTrendFilter(stock)
            && this.matchesCustomOnlyFilter(stock);
    }

    getFilteredStocks = (stocks: Stock[]) => {
        return stocks.filter((stock) => this.matchesAllRandomFilters(stock));
    }

    getAffordableStocks = (stocks: Stock[], accountValue: number) => {
        return stocks.filter((stock) => stock.value <= accountValue);
    }

    getRandomIndex = (max: number) => {
        if (max <= 1) {
            return 0;
        }
        return Math.floor(Math.random() * max);
    }

    getStockWithLowestValue = (stocks: Stock[]) => {
        return stocks.reduce((best, current) => current.value < best.value ? current : best, stocks[0]);
    }

    getStockWithHighestValue = (stocks: Stock[]) => {
        return stocks.reduce((best, current) => current.value > best.value ? current : best, stocks[0]);
    }

    getStockWithLowestVolatility = (stocks: Stock[]) => {
        return stocks.reduce((best, current) => current.volatility < best.volatility ? current : best, stocks[0]);
    }

    getStockWithHighestVolatility = (stocks: Stock[]) => {
        return stocks.reduce((best, current) => current.volatility > best.volatility ? current : best, stocks[0]);
    }

    getStockWithHighestChange = (stocks: Stock[]) => {
        return stocks.reduce((best, current) => current.valueChange > best.valueChange ? current : best, stocks[0]);
    }

    getStockWithLowestChange = (stocks: Stock[]) => {
        return stocks.reduce((best, current) => current.valueChange < best.valueChange ? current : best, stocks[0]);
    }

    pickStockByMode = (stocks: Stock[]) => {
        const { randomBuyMode } = this.state;

        if (stocks.length === 0) {
            return undefined;
        }

        switch (randomBuyMode) {
            case 'CHEAPEST':
                return this.getStockWithLowestValue(stocks);
            case 'EXPENSIVE':
                return this.getStockWithHighestValue(stocks);
            case 'LOW_VOL':
                return this.getStockWithLowestVolatility(stocks);
            case 'HIGH_VOL':
                return this.getStockWithHighestVolatility(stocks);
            case 'MOMENTUM_UP':
                return this.getStockWithHighestChange(stocks);
            case 'DIP_BUY':
                return this.getStockWithLowestChange(stocks);
            case 'RANDOM':
            default: {
                const randomIndex = this.getRandomIndex(stocks.length);
                return stocks[randomIndex];
            }
        }
    }

    getRandomCandidateResult = () => {
        const { stocks, accountValue } = this.props;
        const filteredStocks = this.getFilteredStocks(stocks);
        const affordableStocks = this.getAffordableStocks(filteredStocks, accountValue);
        const pickedStock = this.pickStockByMode(affordableStocks);

        return {
            filteredStocks,
            affordableStocks,
            pickedStock
        };
    }

    updateRandomAttemptStats = (isSuccess: boolean, candidateCount: number, message: string) => {
        this.setState((prevState) => ({
            randomBuyAttemptCount: prevState.randomBuyAttemptCount + 1,
            randomBuySuccessCount: prevState.randomBuySuccessCount + (isSuccess ? 1 : 0),
            randomBuyFailedCount: prevState.randomBuyFailedCount + (isSuccess ? 0 : 1),
            lastRandomCandidateCount: candidateCount,
            lastRandomActionMessage: message
        }));
    }

    updateLastBoughtState = (stock: Stock) => {
        this.setState({
            lastRandomBoughtStock: stock.name,
            lastRandomBoughtPrice: stock.value
        });
    }

    getSuccessRatePercent = () => {
        const { randomBuyAttemptCount, randomBuySuccessCount } = this.state;
        if (randomBuyAttemptCount === 0) {
            return 0;
        }
        return Number(((randomBuySuccessCount / randomBuyAttemptCount) * 100).toFixed(1));
    }

    buildNoCandidateReason = (filteredCount: number, affordableCount: number) => {
        if (filteredCount === 0) {
            return 'No stocks match current random filters.';
        }

        if (affordableCount === 0) {
            return 'Stocks match filters, but none are affordable.';
        }

        return 'No candidate stock was found.';
    }

    startRandomBuyCooldown = () => {
        this.setState({ randomBuyCoolingDown: true });
        this.randomBuyCooldownTimer = window.setTimeout(() => {
            this.setState({ randomBuyCoolingDown: false });
        }, this.state.randomBuyCooldownMs);
    }

    resetRandomBuyStats = () => {
        this.setState({
            randomBuyAttemptCount: 0,
            randomBuySuccessCount: 0,
            randomBuyFailedCount: 0,
            lastRandomBoughtStock: '',
            lastRandomBoughtPrice: 0,
            lastRandomActionMessage: 'Random buy stats reset.',
            lastRandomCandidateCount: 0
        });
    }

    runRandomBuy = (dryRunOverride?: boolean) => {
        const { buy } = this.props;
        const { randomBuyCoolingDown } = this.state;
        const isDryRun = typeof dryRunOverride === 'boolean' ? dryRunOverride : this.state.randomBuyDryRun;

        if (randomBuyCoolingDown) {
            return;
        }

        if (this.hasContradictingTrendFilters()) {
            const message = 'Both positive and negative trend filters are active. Disable one of them.';
            this.updateRandomAttemptStats(false, 0, message);
            addNotification({
                level: 'warning',
                message
            });
            return;
        }

        this.startRandomBuyCooldown();

        const { filteredStocks, affordableStocks, pickedStock } = this.getRandomCandidateResult();

        if (!pickedStock) {
            const message = this.buildNoCandidateReason(filteredStocks.length, affordableStocks.length);
            this.updateRandomAttemptStats(false, affordableStocks.length, message);
            addNotification({
                level: 'error',
                message
            });
            return;
        }

        if (isDryRun) {
            const previewMessage = `Preview: ${pickedStock.name} at ${pickedStock.value.toFixed(2)} (${this.getModeDescription()}).`;
            this.updateRandomAttemptStats(true, affordableStocks.length, previewMessage);
            this.updateLastBoughtState(pickedStock);
            addNotification({
                level: 'info',
                message: previewMessage
            });
            return;
        }

        // Keep one share purchase per click.
        buy(pickedStock.name, 1);
        this.updateRandomAttemptStats(true, affordableStocks.length, `Bought 1 share of ${pickedStock.name}.`);
        this.updateLastBoughtState(pickedStock);
        addNotification({
            level: 'success',
            message: `Bought 1 share of ${pickedStock.name} (${pickedStock.value.toFixed(2)}).`
        });
    }

    buyRandomStock = () => {
        this.runRandomBuy(false);
    }

    previewRandomStock = () => {
        this.runRandomBuy(true);
    }

    buyCheapestStock = () => {
        this.setState({ randomBuyMode: 'CHEAPEST' }, () => this.runRandomBuy(false));
    }

    buyMostExpensiveStock = () => {
        this.setState({ randomBuyMode: 'EXPENSIVE' }, () => this.runRandomBuy(false));
    }

    buyLowVolatilityStock = () => {
        this.setState({ randomBuyMode: 'LOW_VOL' }, () => this.runRandomBuy(false));
    }

    buyHighVolatilityStock = () => {
        this.setState({ randomBuyMode: 'HIGH_VOL' }, () => this.runRandomBuy(false));
    }

    buyBestMomentumStock = () => {
        this.setState({ randomBuyMode: 'MOMENTUM_UP' }, () => this.runRandomBuy(false));
    }

    buyBiggestDipStock = () => {
        this.setState({ randomBuyMode: 'DIP_BUY' }, () => this.runRandomBuy(false));
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
        const {
            randomBuyCoolingDown,
            randomBuyCooldownMs,
            randomBuyMode,
            randomBuyDryRun,
            randomBuyUseMinPrice,
            randomBuyMinPrice,
            randomBuyUseMaxPrice,
            randomBuyMaxPrice,
            randomBuyRequirePositiveChange,
            randomBuyRequireNegativeChange,
            randomBuyRequireCustomOnly,
            randomBuyAttemptCount,
            randomBuySuccessCount,
            randomBuyFailedCount,
            lastRandomBoughtStock,
            lastRandomBoughtPrice,
            lastRandomActionMessage,
            lastRandomCandidateCount
        } = this.state;
        const filteredStocks = this.getFilteredStocks(stocks);
        const affordableFilteredStocks = this.getAffordableStocks(filteredStocks, accountValue);
        const randomBuyDisabled = randomBuyCoolingDown || affordableFilteredStocks.length === 0 || this.hasContradictingTrendFilters();
        const successRate = this.getSuccessRatePercent();
        console.log('[MARKET] Render - stocks count:', stocks.length, 'buy function:', typeof buy, 'sell function:', typeof sell);

        return (
            <div className="content">
                <Container fluid={true}>
                    <Row>
                        <Col xs={12}>
                            <div style={{ marginTop: '12px', marginBottom: '4px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <strong>Random Buy Toolkit</strong>
                                </div>

                                <div style={{ marginBottom: '8px' }}>
                                    <label style={{ marginRight: '8px' }}>Mode:</label>
                                    <select
                                        value={randomBuyMode}
                                        onChange={(event) => this.setRandomBuyMode(event.target.value as RandomBuyMode)}
                                    >
                                        <option value="RANDOM">Random</option>
                                        <option value="CHEAPEST">Cheapest</option>
                                        <option value="EXPENSIVE">Most Expensive</option>
                                        <option value="LOW_VOL">Lowest Volatility</option>
                                        <option value="HIGH_VOL">Highest Volatility</option>
                                        <option value="MOMENTUM_UP">Best Momentum</option>
                                        <option value="DIP_BUY">Biggest Dip</option>
                                    </select>

                                    <label style={{ marginLeft: '14px', marginRight: '8px' }}>Cooldown (ms):</label>
                                    <input
                                        type="number"
                                        min={MIN_RANDOM_COOLDOWN_MS}
                                        max={MAX_RANDOM_COOLDOWN_MS}
                                        value={randomBuyCooldownMs}
                                        onChange={(event) => this.setRandomBuyCooldownMs(this.sanitizeNonNegativeNumber(event.target.value, DEFAULT_RANDOM_BUY_COOLDOWN_MS))}
                                        style={{ width: '90px' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '8px' }}>
                                    <label style={{ marginRight: '12px' }}>
                                        <input type="checkbox" checked={randomBuyDryRun} onChange={this.toggleRandomBuyDryRun} />
                                        <span style={{ marginLeft: '4px' }}>Dry Run</span>
                                    </label>
                                    <label style={{ marginRight: '12px' }}>
                                        <input type="checkbox" checked={randomBuyUseMinPrice} onChange={this.toggleRandomBuyMinPrice} />
                                        <span style={{ marginLeft: '4px' }}>Use Min Price</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={randomBuyMinPrice}
                                        disabled={!randomBuyUseMinPrice}
                                        onChange={(event) => this.setRandomBuyMinPrice(event.target.value)}
                                        style={{ width: '90px', marginRight: '12px' }}
                                    />
                                    <label style={{ marginRight: '12px' }}>
                                        <input type="checkbox" checked={randomBuyUseMaxPrice} onChange={this.toggleRandomBuyMaxPrice} />
                                        <span style={{ marginLeft: '4px' }}>Use Max Price</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={randomBuyMaxPrice}
                                        disabled={!randomBuyUseMaxPrice}
                                        onChange={(event) => this.setRandomBuyMaxPrice(event.target.value)}
                                        style={{ width: '90px' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '8px' }}>
                                    <label style={{ marginRight: '12px' }}>
                                        <input
                                            type="checkbox"
                                            checked={randomBuyRequirePositiveChange}
                                            onChange={this.toggleRandomBuyRequirePositiveChange}
                                        />
                                        <span style={{ marginLeft: '4px' }}>Only Positive Change</span>
                                    </label>
                                    <label style={{ marginRight: '12px' }}>
                                        <input
                                            type="checkbox"
                                            checked={randomBuyRequireNegativeChange}
                                            onChange={this.toggleRandomBuyRequireNegativeChange}
                                        />
                                        <span style={{ marginLeft: '4px' }}>Only Negative Change</span>
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={randomBuyRequireCustomOnly}
                                            onChange={this.toggleRandomBuyRequireCustomOnly}
                                        />
                                        <span style={{ marginLeft: '4px' }}>Custom Stocks Only</span>
                                    </label>
                                </div>

                                <div style={{ marginBottom: '8px' }}>
                                    <button
                                        className="btn btn-sm btn-info"
                                        onClick={this.buyRandomStock}
                                        disabled={randomBuyDisabled}
                                        style={{ marginRight: '6px' }}
                                    >
                                        {randomBuyCoolingDown ? 'Random Buy Cooling...' : 'Buy Random Stock (1)'}
                                    </button>
                                    <button
                                        className="btn btn-sm btn-default"
                                        onClick={this.previewRandomStock}
                                        disabled={randomBuyCoolingDown}
                                        style={{ marginRight: '6px' }}
                                    >
                                        Preview Candidate
                                    </button>
                                    <button className="btn btn-sm btn-warning" onClick={this.resetRandomBuyStats}>Reset Random Stats</button>
                                </div>

                                <div style={{ marginBottom: '8px' }}>
                                    <button className="btn btn-xs btn-default" onClick={() => this.setRandomBuyCooldownMs(100)} style={{ marginRight: '6px' }}>Fast 100ms</button>
                                    <button className="btn btn-xs btn-default" onClick={() => this.setRandomBuyCooldownMs(300)} style={{ marginRight: '6px' }}>Normal 300ms</button>
                                    <button className="btn btn-xs btn-default" onClick={() => this.setRandomBuyCooldownMs(800)} style={{ marginRight: '6px' }}>Slow 800ms</button>
                                </div>

                                <div style={{ marginBottom: '8px' }}>
                                    <button className="btn btn-xs btn-primary" onClick={this.buyCheapestStock} disabled={randomBuyDisabled} style={{ marginRight: '6px' }}>Buy Cheapest</button>
                                    <button className="btn btn-xs btn-primary" onClick={this.buyMostExpensiveStock} disabled={randomBuyDisabled} style={{ marginRight: '6px' }}>Buy Expensive</button>
                                    <button className="btn btn-xs btn-primary" onClick={this.buyLowVolatilityStock} disabled={randomBuyDisabled} style={{ marginRight: '6px' }}>Buy Low Vol</button>
                                    <button className="btn btn-xs btn-primary" onClick={this.buyHighVolatilityStock} disabled={randomBuyDisabled} style={{ marginRight: '6px' }}>Buy High Vol</button>
                                    <button className="btn btn-xs btn-primary" onClick={this.buyBestMomentumStock} disabled={randomBuyDisabled} style={{ marginRight: '6px' }}>Buy Momentum</button>
                                    <button className="btn btn-xs btn-primary" onClick={this.buyBiggestDipStock} disabled={randomBuyDisabled}>Buy Dip</button>
                                </div>

                                <div style={{ fontSize: '12px', color: '#495057' }}>
                                    <span style={{ marginRight: '10px' }}>Filtered: {filteredStocks.length}</span>
                                    <span style={{ marginRight: '10px' }}>Affordable: {affordableFilteredStocks.length}</span>
                                    <span style={{ marginRight: '10px' }}>Mode: {this.getModeDescription()}</span>
                                    <span style={{ marginRight: '10px' }}>Attempts: {randomBuyAttemptCount}</span>
                                    <span style={{ marginRight: '10px' }}>Success: {randomBuySuccessCount}</span>
                                    <span style={{ marginRight: '10px' }}>Failed: {randomBuyFailedCount}</span>
                                    <span style={{ marginRight: '10px' }}>Success Rate: {successRate}%</span>
                                    <span style={{ marginRight: '10px' }}>Last Candidates: {lastRandomCandidateCount}</span>
                                    <span style={{ marginRight: '10px' }}>
                                        Last Bought: {lastRandomBoughtStock ? `${lastRandomBoughtStock} (${lastRandomBoughtPrice.toFixed(2)})` : 'N/A'}
                                    </span>
                                </div>
                                <div style={{ marginTop: '6px', fontSize: '12px', color: '#6c757d' }}>
                                    {lastRandomActionMessage}
                                </div>
                                {this.hasContradictingTrendFilters() && (
                                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#b02a37' }}>
                                        Trend filters conflict: disable either positive or negative filter.
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>

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
