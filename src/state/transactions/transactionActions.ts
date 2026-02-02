import { GenericAction } from '../AppState';

export const ADD_TRANSACTION = 'transactionReducer/add-transaction';

export interface Transaction {
    id: string;
    type: 'BUY' | 'SELL';
    stockName: string;
    quantity: number;
    pricePerShare: number;
    totalValue: number;
    timestamp: Date;
}

export const addTransaction = (
    type: 'BUY' | 'SELL',
    stockName: string,
    quantity: number,
    pricePerShare: number
): AddTransactionAction => ({
    type: ADD_TRANSACTION,
    transactionType: type,
    stockName,
    quantity,
    pricePerShare,
    totalValue: quantity * pricePerShare,
    timestamp: new Date()
});

export interface AddTransactionAction extends GenericAction {
    type: string;
    transactionType: 'BUY' | 'SELL';
    stockName: string;
    quantity: number;
    pricePerShare: number;
    totalValue: number;
    timestamp: Date;
}
