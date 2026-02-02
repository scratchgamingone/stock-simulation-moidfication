import moment from 'moment';
import { delay, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { addNotification } from '../../components/NotificationSystem';
import { cloneState, FinancialSnapshot, Stock } from '../AppState';
import { StockConfig as Config } from '../Config';
import { changeAccountValue } from '../depot/depotActions';
import { getAccountValue } from '../depot/depotSelector';
import { addTransaction } from '../transactions/transactionActions';
import {
    addStocks,
    BUY_OR_SELL_STOCKS,
    BuyOrSellStockAction,
    CALCULATE_NEXT_STOCK_VALUES,
    calculateNextStockValues,
    changeStockQuantity,
    DELETE_CUSTOM_STOCK,
    DeleteCustomStockAction,
    LOAD_STOCKS,
    UpdateStockData,
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

    // set Default values
    stocks.forEach(stock => {
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
    console.log('[SAGA] Initial stocks loaded, starting update loop');
    yield put(calculateNextStockValues());
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
}

function* stockMarketSaga() {
    console.log('[SAGA] stockMarketSaga initialized');
    yield takeEvery(LOAD_STOCKS, loadinitialStocks);
    yield takeEvery(BUY_OR_SELL_STOCKS, buyOrSellStocks);
    yield takeEvery(CALCULATE_NEXT_STOCK_VALUES, calculateAllNextStockValues);
    yield takeEvery(DELETE_CUSTOM_STOCK, deleteCustomStockSaga);
}

export default stockMarketSaga;