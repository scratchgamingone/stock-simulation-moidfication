import { createSelector } from 'reselect';
import { AppState, StockCategoryValue } from '../AppState';
import { getStocks } from '../stockMarket/stockSelector';

export const getAccountValue = ( state: AppState ) => state.depot.accountValue;
export const getStockValue = createSelector( getStocks, ( stocks ) => {
    const total = stocks.reduce( ( acc, item ) => {
        const itemValue = item.value * item.quantity;
        // Check if itemValue is a valid number, otherwise treat as 0
        if (typeof itemValue === 'number' && !isNaN(itemValue) && isFinite(itemValue)) {
            return acc + itemValue;
        }
        return acc;
    }, 0 );
    
    // Ensure the result is a valid number
    return (typeof total === 'number' && !isNaN(total) && isFinite(total)) ? total : 0;
} );

export const getCapital = ( state: AppState ) => {
    const accountValue = getAccountValue( state );
    const stockValue = getStockValue( state );
    const total = accountValue + stockValue;
    
    // Ensure the result is a valid number
    return (typeof total === 'number' && !isNaN(total) && isFinite(total)) ? total : 0;
};

export const getStockValueDevelopment = ( state: AppState ) => state.depot.stockValueDevelopment;

export const getStockCategoryValues = ( state: AppState ) => {
    let categoryValues: StockCategoryValue[] = [];
    let totalQuantity = 0;

    state.stockMarket.stocks.forEach( s => {
        let catIndex = categoryValues.findIndex( v => v.categoryName === s.type );
        if (catIndex === -1) {
            categoryValues.push( {categoryName: s.type, ratio: s.quantity} );
        } else {
            categoryValues[catIndex].ratio += s.quantity;
        }
        totalQuantity += s.quantity;
    } );

    // remove all categoryValues without any Value
    categoryValues = categoryValues.filter( c => c.ratio > 0 );

    categoryValues.forEach( c => {
        c.ratio = c.ratio * 100 / totalQuantity;
    } );

    return categoryValues;
};

export const getPossessedStocks = ( state: AppState ) =>
    state.stockMarket.stocks.filter( stock => stock.quantity > 0 );