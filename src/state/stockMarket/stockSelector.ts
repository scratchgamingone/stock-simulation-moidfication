import { AppState } from '../AppState';

export const getStocks = (state: AppState) => state.stockMarket.stocks;

export const getStocksByOwnedQuantity = (state: AppState) => {
    return [...getStocks(state)].sort((a, b) => {
        if (a.quantity !== b.quantity) {
            return b.quantity - a.quantity;
        }

        if (a.value !== b.value) {
            return b.value - a.value;
        }

        return a.name.localeCompare(b.name);
    });
};

// counts how many stocks the user owns
export const getOwnedStocksAmount = (state: AppState) => {
    let amount = 0;

    getStocks(state).forEach(s => {
        amount += s.quantity;
    });

    return amount;
};
