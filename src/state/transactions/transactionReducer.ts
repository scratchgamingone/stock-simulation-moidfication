import { cloneState, GenericAction } from '../AppState';
import { ADD_TRANSACTION, AddTransactionAction, Transaction } from './transactionActions';

export interface TransactionState {
    transactions: Transaction[];
}

const initialState: TransactionState = {
    transactions: []
};

const transactionReducer = (state = initialState, action: GenericAction): TransactionState => {
    switch (action.type) {
        case ADD_TRANSACTION: {
            const { transactionType, stockName, quantity, pricePerShare, totalValue, timestamp } = 
                (action as AddTransactionAction);
            
            const clone = cloneState(state);
            
            const newTransaction: Transaction = {
                id: `${Date.now()}-${Math.random()}`,
                type: transactionType,
                stockName,
                quantity,
                pricePerShare,
                totalValue,
                timestamp
            };
            
            clone.transactions.unshift(newTransaction); // Add to beginning for latest first
            
            return clone;
        }
        
        default:
            return state;
    }
};

export default transactionReducer;
