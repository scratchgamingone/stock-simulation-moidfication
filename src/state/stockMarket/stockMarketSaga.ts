import moment from 'moment';
import { call, delay, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { addNotification } from '../../components/NotificationSystem';
import {
    addAlertEvent,
    deactivateAlertRule,
    AlertRule,
    AlertRuleType
} from '../alerts/alertsActions';
import { getActiveAlertRules } from '../alerts/alertsSelector';
import {
    fetchBackgroundTrackedPrices,
    isBackgroundTrackerEnabled,
    syncPortfolioToBackgroundTracker
} from '../../services/backgroundTrackerService';
import {
    deactivateOrderRule,
    OrderRule
} from '../orders/ordersActions';
import { getActiveOrderRules } from '../orders/ordersSelector';
import { fetchMultipleStockPrices } from '../../services/stockApiService';
import { cloneState, FinancialSnapshot, Stock } from '../AppState';
import { StockConfig as Config } from '../Config';
import { changeAccountValue } from '../depot/depotActions';
import { getAccountValue } from '../depot/depotSelector';
import { addTransaction } from '../transactions/transactionActions';
import {
    ADD_CUSTOM_STOCK,
    addStocks,
    BUY_OR_SELL_STOCKS,
    BuyOrSellStockAction,
    CALCULATE_NEXT_STOCK_VALUES,
    calculateNextStockValues,
    changeStockQuantity,
    DELETE_CUSTOM_STOCK,
    DeleteCustomStockAction,
    LOAD_STOCKS,
    REFRESH_STOCKS_FROM_PUBLIC_API,
    UpdateStockData,
    refreshStocksFromPublicApi,
    updateStocks
} from './stockMarketActions';
import { getStocks } from './stockSelector';

function getRandomArbitrary(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function getValueChange(valueHistory: FinancialSnapshot[]) {
    const oldestValue = valueHistory[0].value;
    const newestValue = valueHistory[valueHistory.length - 1].value;
    if (oldestValue && newestValue) {
        return (newestValue - oldestValue) / oldestValue * 100;
    }
    return 0;
}

const stockJson = require('./stocks.json');

function getNextValue(currentValue: number, volatility: number): number {
    volatility = volatility / 100;
    const random = getRandomArbitrary(0, 1);
    let changePercent = 2 * volatility * random;
    if (changePercent > volatility) {
        changePercent -= (2 * volatility);
    }
    const changeAmount = currentValue * changePercent;
    const nextAmount = currentValue + changeAmount;

    if (nextAmount <= 0) {
        return getNextValue(currentValue, volatility);
    }
    return Number(nextAmount.toFixed(2));
}

function* loadinitialStocks() {
    let stocks: Stock[] = stockJson;

    const loadedStocks: Stock[] = yield select(getStocks);
    const stocksCached = loadedStocks && loadedStocks.length > 0;
    if (stocksCached) {
        stocks = loadedStocks;
    }

    let trackedPrices = new Map<string, number>();
    if (isBackgroundTrackerEnabled()) {
        trackedPrices = yield call(fetchBackgroundTrackedPrices);
    }

    // set Default values
    stocks.forEach(stock => {
        const trackedPrice = trackedPrices.get(stock.name);
        if (typeof trackedPrice === 'number' && trackedPrice > 0) {
            stock.value = Number(trackedPrice.toFixed(2));
        }

        if (!stocksCached) {
            stock.quantity = 0;
        }
        stock.valueHistory = [];

        for (let i = Config.points(); i >= 0; i--) {
            const nextValue = getNextValue(stock.value, stock.volatility);
            stock.valueHistory.push({
                value: nextValue,
                date: moment().subtract(i * Config.interval, 'seconds').format('HH:mm'),
            });
            stock.value = nextValue;
        }

        stock.valueChange = getValueChange(stock.valueHistory);
    });

    yield put(addStocks(stocks));
    yield call(syncPortfolioToBackgroundTracker, stocks);
    yield put(refreshStocksFromPublicApi());
    console.log('[SAGA] Initial stocks loaded, starting update loop');
    yield put(calculateNextStockValues());
}

function* refreshStocksFromPublicApiSaga() {
    try {
        const stocks: Stock[] = yield select(getStocks);
        if (!stocks || !stocks.length) {
            return;
        }

        const stockNames = stocks.map((stock) => stock.name);
        const livePrices: Map<string, number> = yield call(fetchMultipleStockPrices, stockNames);

        if (!livePrices || !livePrices.size) {
            return;
        }

        const updates: UpdateStockData[] = [];

        for (const stock of stocks) {
            const livePrice = livePrices.get(stock.name);
            if (typeof livePrice !== 'number' || !Number.isFinite(livePrice) || livePrice <= 0) {
                continue;
            }

            const roundedPrice = Number(livePrice.toFixed(2));
            const valueHistory = cloneState(stock.valueHistory || []);

            if (valueHistory.length > 0) {
                valueHistory[valueHistory.length - 1] = {
                    value: roundedPrice,
                    date: moment().format('HH:mm')
                };
            } else {
                valueHistory.push({
                    value: roundedPrice,
                    date: moment().format('HH:mm')
                });
            }

            updates.push({
                stockName: stock.name,
                stock: {
                    ...stock,
                    value: roundedPrice,
                    valueHistory,
                    valueChange: Number(getValueChange(valueHistory).toFixed(2))
                }
            });
        }

        if (updates.length > 0) {
            yield put(updateStocks(updates));

            const latestStocks: Stock[] = yield select(getStocks);
            yield call(syncPortfolioToBackgroundTracker, latestStocks);

            addNotification({
                title: 'Stock Prices Updated',
                message: 'Live stock prices were synced from public market APIs.',
                level: 'success'
            });
        }
    } catch (error) {
        console.warn('[SAGA] Could not refresh stock prices from public API:', error);
    }
}

function* buyOrSellStocks(action: BuyOrSellStockAction) {
    console.log('[SAGA] buyOrSellStocks called:', action);
    // search the stock to buy
    let stocks: Stock[] = yield select(getStocks);
    const actionStock: Stock | undefined = stocks.find(s => s.name === action.stockName);

    if (!actionStock) {
        console.error('[SAGA] Stock not found:', action.stockName);
        addNotification({
            level: 'error',
            message: 'Stock with name ' + action.stockName + ' could not be found'
        });
        return;
    }

    const accountValue = yield select(getAccountValue);
    console.log('[SAGA] Account value:', accountValue, 'Stock price:', actionStock.value, 'Amount:', action.amount);

    // check if enought money
    const totalStockBuyValue = actionStock!.value * action.amount;
    if (accountValue < totalStockBuyValue) {
        addNotification({
            level: 'error',
            message: 'Not enough Money'
        });
        return;
    }

    // check if you can sell/buy amount of stocks
    if (actionStock.quantity + action.amount < 0) {
        addNotification({
            level: 'error',
            message: 'Cant sell stock you dont own'
        });
        return;
    }

    // if it's get to here everything is valid

    // Buy Stocks
    // update stocks in Store
    yield put(changeStockQuantity(action.stockName, action.amount));
    yield put(changeAccountValue(-totalStockBuyValue));
    
    // Track transaction
    const transactionType = action.amount > 0 ? 'BUY' : 'SELL';
    const transactionQuantity = Math.abs(action.amount);
    yield put(addTransaction(
        transactionType,
        action.stockName,
        transactionQuantity,
        actionStock!.value
    ));
    
    stocks = yield select(getStocks);
    yield call(syncPortfolioToBackgroundTracker, stocks);
}

function isOrderTriggered(rule: OrderRule, stock: Stock): boolean {
    if (rule.type === 'STOP_LOSS') {
        return stock.value <= rule.triggerPrice;
    }

    return stock.value >= rule.triggerPrice;
}

function isAlertTriggered(rule: AlertRule, stock: Stock): boolean {
    switch (rule.type as AlertRuleType) {
        case 'PRICE_ABOVE':
            return stock.value >= rule.threshold;
        case 'PRICE_BELOW':
            return stock.value <= rule.threshold;
        case 'VALUE_CHANGE_ABOVE':
            return stock.valueChange >= rule.threshold;
        case 'VALUE_CHANGE_BELOW':
            return stock.valueChange <= rule.threshold;
        default:
            return false;
    }
}

function getAlertDescription(rule: AlertRule, stock: Stock): string {
    const roundedPrice = Number(stock.value.toFixed(2));
    const roundedChange = Number(stock.valueChange.toFixed(2));

    switch (rule.type as AlertRuleType) {
        case 'PRICE_ABOVE':
            return `${stock.name} reached ${roundedPrice} (above ${rule.threshold}).`;
        case 'PRICE_BELOW':
            return `${stock.name} dropped to ${roundedPrice} (below ${rule.threshold}).`;
        case 'VALUE_CHANGE_ABOVE':
            return `${stock.name} change is ${roundedChange}% (above ${rule.threshold}%).`;
        case 'VALUE_CHANGE_BELOW':
            return `${stock.name} change is ${roundedChange}% (below ${rule.threshold}%).`;
        default:
            return `${stock.name} alert condition triggered.`;
    }
}

function* evaluateRiskRules() {
    const stocks: Stock[] = yield select(getStocks);
    const activeOrderRules: OrderRule[] = yield select(getActiveOrderRules);
    const activeAlertRules: AlertRule[] = yield select(getActiveAlertRules);

    if (activeOrderRules.length > 0) {
        for (const rule of activeOrderRules) {
            const stock = stocks.find((item) => item.name === rule.stockName);
            if (!stock || stock.quantity <= 0) {
                continue;
            }

            if (!isOrderTriggered(rule, stock)) {
                continue;
            }

            const sellQuantity = rule.quantity && rule.quantity > 0
                ? Math.min(stock.quantity, Math.floor(rule.quantity))
                : stock.quantity;

            if (sellQuantity <= 0) {
                continue;
            }

            yield put(deactivateOrderRule(rule.id));
            yield put({
                type: BUY_OR_SELL_STOCKS,
                stockName: stock.name,
                amount: -sellQuantity
            });

            addNotification({
                title: `${rule.type === 'STOP_LOSS' ? 'Stop-Loss' : 'Take-Profit'} Executed`,
                message: `${stock.name}: sold ${sellQuantity} share(s) at ${stock.value.toFixed(2)}.`,
                level: 'warning'
            });
        }
    }

    if (activeAlertRules.length > 0) {
        for (const rule of activeAlertRules) {
            const stock = stocks.find((item) => item.name === rule.stockName);
            if (!stock) {
                continue;
            }

            if (!isAlertTriggered(rule, stock)) {
                continue;
            }

            const message = getAlertDescription(rule, stock);
            yield put(deactivateAlertRule(rule.id));
            yield put(addAlertEvent(rule.id, stock.name, message));

            addNotification({
                title: 'Price Alert Triggered',
                message,
                level: 'info'
            });
        }
    }
}

function* calculateAllNextStockValues() {
    try {
        console.log('[SAGA] calculateAllNextStockValues - Starting stock update cycle');
        const stocks: Stock[] = yield select(getStocks);
        console.log('[SAGA] Found', stocks.length, 'stocks to update');
        const updates: UpdateStockData[] = [];

        for (let s of stocks) {
            let newValue = getNextValue(s.value, s.volatility);
            var valueHistory = cloneState(s.valueHistory);
            valueHistory.splice(0, 1); // delete first entry
            valueHistory.push({
                value: newValue,
                date: moment().format('HH:mm')
            });

            const valueChange = getValueChange(valueHistory);

            updates.push({
                stockName: s.name,
                stock: {
                    ...s,
                    valueHistory: valueHistory,
                    value: newValue,
                    valueChange: Number(valueChange.toFixed(2))
                }
            });
        }

        console.log('[SAGA] Updating', updates.length, 'stocks');
        yield put(updateStocks(updates));
        yield call(evaluateRiskRules);
        console.log('[SAGA] Waiting', Config.interval, 'seconds before next update');
        yield delay(Config.interval * 1000);
        console.log('[SAGA] Dispatching next calculation');
        yield put(calculateNextStockValues());
    } catch (error) {
        console.error('[SAGA] Error in calculateAllNextStockValues:', error);
        // Continue the loop even on error
        yield delay(Config.interval * 1000);
        yield put(calculateNextStockValues());
    }
}

function* deleteCustomStockSaga(action: DeleteCustomStockAction) {
    const stocks: Stock[] = yield select(getStocks);
    const stock = stocks.find(s => s.name === action.stockName);
    
    if (stock) {
        if (stock.quantity && stock.quantity > 0) {
            // Calculate refund amount - ensure it's a valid number
            const refundAmount = Number((stock.value * stock.quantity).toFixed(2));
            
            if (refundAmount && refundAmount > 0 && !isNaN(refundAmount)) {
                // Add cash back to account
                yield put(changeAccountValue(refundAmount));
                
                // Show notification
                addNotification({
                    title: 'Stock Deleted',
                    message: `${stock.name} deleted. Refunded $${refundAmount.toFixed(2)} for ${stock.quantity} shares.`,
                    level: 'info'
                });
            } else {
                addNotification({
                    title: 'Stock Deleted',
                    message: `${stock.name} has been removed from the market.`,
                    level: 'info'
                });
            }
        } else {
            addNotification({
                title: 'Stock Deleted',
                message: `${stock.name} has been removed from the market.`,
                level: 'info'
            });
        }
    }

    const latestStocks: Stock[] = yield select(getStocks);
    yield call(syncPortfolioToBackgroundTracker, latestStocks);
}

function* syncPortfolioSaga() {
    const stocks: Stock[] = yield select(getStocks);
    yield call(syncPortfolioToBackgroundTracker, stocks);
}

function* stockMarketSaga() {
    console.log('[SAGA] stockMarketSaga initialized');
    yield takeEvery(LOAD_STOCKS, loadinitialStocks);
    yield takeLatest(REFRESH_STOCKS_FROM_PUBLIC_API, refreshStocksFromPublicApiSaga);
    yield takeEvery(ADD_CUSTOM_STOCK, syncPortfolioSaga);
    yield takeEvery(BUY_OR_SELL_STOCKS, buyOrSellStocks);
    yield takeEvery(CALCULATE_NEXT_STOCK_VALUES, calculateAllNextStockValues);
    yield takeEvery(DELETE_CUSTOM_STOCK, deleteCustomStockSaga);
}

export default stockMarketSaga;