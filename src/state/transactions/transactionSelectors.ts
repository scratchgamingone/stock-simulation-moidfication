import { createSelector } from 'reselect';
import { AppState, Stock } from '../AppState';
import { getStocks } from '../stockMarket/stockSelector';

export const getTransactions = (state: AppState) => state.transactions.transactions;

export const getTransactionCount = (state: AppState) => {
    const transactions = getTransactions(state);
    return transactions ? transactions.length : 0;
};

interface StockPosition {
    quantity: number;
    costBasis: number;
}

export const getTransactionsSortedAsc = createSelector(
    [getTransactions],
    (transactions) => {
        if (!transactions || transactions.length === 0) {
            return [];
        }
        return [...transactions].sort((a, b) => {
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });
    }
);

export const getHoldingsCostBasisByStock = createSelector(
    [getTransactionsSortedAsc],
    (transactions) => {
        const positions: Record<string, StockPosition> = {};

        transactions.forEach((transaction) => {
            const pos = positions[transaction.stockName] || { quantity: 0, costBasis: 0 };

            if (transaction.type === 'BUY') {
                pos.quantity += transaction.quantity;
                pos.costBasis += transaction.totalValue;
            } else {
                if (pos.quantity > 0) {
                    const avgCost = pos.costBasis / pos.quantity;
                    const qtyToSell = Math.min(pos.quantity, transaction.quantity);
                    pos.quantity -= qtyToSell;
                    pos.costBasis -= avgCost * qtyToSell;
                    if (pos.quantity <= 0) {
                        pos.quantity = 0;
                        pos.costBasis = 0;
                    }
                }
            }

            positions[transaction.stockName] = pos;
        });

        return positions;
    }
);

export interface HoldingsSummary {
    totalMarketValue: number;
    totalCostBasis: number;
    totalUnrealizedPnL: number;
    perStock: Record<string, { marketValue: number; costBasis: number; unrealizedPnL: number; quantity: number }>;
}

export const getHoldingsSummary = createSelector(
    [getStocks, getHoldingsCostBasisByStock],
    (stocks: Stock[], costBasisByStock): HoldingsSummary => {
        let totalMarketValue = 0;
        let totalCostBasis = 0;
        const perStock: HoldingsSummary['perStock'] = {};

        stocks.forEach((stock) => {
            if (stock.quantity <= 0) {
                return;
            }

            const marketValue = stock.value * stock.quantity;
            const costBasis = costBasisByStock[stock.name]?.costBasis || 0;
            const unrealizedPnL = marketValue - costBasis;

            totalMarketValue += marketValue;
            totalCostBasis += costBasis;

            perStock[stock.name] = {
                marketValue,
                costBasis,
                unrealizedPnL,
                quantity: stock.quantity
            };
        });

        return {
            totalMarketValue,
            totalCostBasis,
            totalUnrealizedPnL: totalMarketValue - totalCostBasis,
            perStock
        };
    }
);
