import { cloneState, GenericAction, Stock, StockMarketState } from '../AppState';
import {
    ADD_CUSTOM_STOCK,
    ADD_STOCKS,
    AddCustomStockAction,
    AddStocksAction,
    CHANGE_STOCK_QUANTITY,
    ChangeStockQuantityAction,
    DELETE_CUSTOM_STOCK,
    DeleteCustomStockAction,
    UPDATE_STOCK, UPDATE_STOCKS, UpdateStockAction, UpdateStocksAction
} from './stockMarketActions';
import { StockConfig } from '../Config';

const initialState: StockMarketState = {
    stocks: [],
};

const stockMarketReducer = ( state = initialState, action: GenericAction ) => {
        switch ( action.type ) {
            case ADD_STOCKS: {
                const stocks = (action as AddStocksAction).stocks;

                return {
                    ...state,
                    stocks
                };
            }

            case ADD_CUSTOM_STOCK: {
                const { symbol, name, initialPrice } = (action as AddCustomStockAction);
                const clone = cloneState(state);
                
                console.log('ADD_CUSTOM_STOCK:', { symbol, name, initialPrice });
                
                // Check if stock already exists
                const exists = clone.stocks.find(s => s.name === symbol);
                if (exists) {
                    return state; // Don't add duplicate
                }
                
                // Ensure price is a valid number
                const validPrice = (typeof initialPrice === 'number' && !isNaN(initialPrice) && initialPrice > 0) 
                    ? initialPrice 
                    : 100;
                
                console.log('Using price:', validPrice);
                
                // Create new stock with initial history
                const valueHistory = [];
                for (let i = StockConfig.points() - 1; i >= 0; i--) {
                    valueHistory.push({
                        value: validPrice,
                        date: new Date(Date.now() - i * 60000).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })
                    });
                }
                
                const newStock: Stock = {
                    name: symbol,
                    value: validPrice,
                    volatility: 0.02,
                    valueChange: 0,
                    type: 'Technology' as StockType,
                    valueHistory: valueHistory,
                    quantity: 0,
                    custom: true
                };
                
                console.log('Created stock:', newStock);
                
                clone.stocks.push(newStock);
                
                return clone;
            }

            case DELETE_CUSTOM_STOCK: {
                const { stockName } = (action as DeleteCustomStockAction);
                const clone = cloneState(state);
                
                // Find the stock
                const stockIndex = clone.stocks.findIndex(s => s.name === stockName);
                if (stockIndex === -1) {
                    return state; // Stock not found
                }
                
                // Remove the stock from the list (allow deletion of any stock)
                clone.stocks.splice(stockIndex, 1);
                
                return clone;
            }

            case UPDATE_STOCK: {
                const updateStockAction = (action as UpdateStockAction);
                const clone = cloneState( state );
                const index = clone.stocks.findIndex( s => s.name === updateStockAction.stockName );

                if (index === -1) {
                    console.error('[REDUCER] Stock not found for update:', updateStockAction.stockName);
                    return state;
                }

                clone.stocks[ index ] = { ...clone.stocks[ index ], ...updateStockAction.stock };

                return clone;
            }

            case UPDATE_STOCKS: {
                const updateStockAction = (action as UpdateStocksAction);
                const clone = cloneState( state );
                updateStockAction.updates.forEach( u => {
                    const index = clone.stocks.findIndex( s => s.name === u.stockName );
                    if (index !== -1) {
                        clone.stocks[ index ] = { ...clone.stocks[ index ], ...u.stock };
                    } else {
                        console.error('[REDUCER] Stock not found for update:', u.stockName);
                    }
                } );

                return clone;
            }
            case
            CHANGE_STOCK_QUANTITY: {
                const clone = cloneState( state );

                const name = (action as ChangeStockQuantityAction).name;
                const amount = (action as ChangeStockQuantityAction).amount;

                const index = clone.stocks.findIndex( s => s.name === name );
                
                if (index === -1) {
                    console.error('[REDUCER] Stock not found:', name);
                    return state;
                }
                
                clone.stocks[ index ].quantity += amount;

                return clone;
            }

            default: {
                return state;
            }
        }

    }
;

export default stockMarketReducer;