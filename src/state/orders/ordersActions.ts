import { GenericAction } from '../AppState';

export const ADD_ORDER_RULE = 'ordersReducer/add-order-rule';
export const DEACTIVATE_ORDER_RULE = 'ordersReducer/deactivate-order-rule';
export const REMOVE_ORDER_RULE = 'ordersReducer/remove-order-rule';

export type OrderRuleType = 'STOP_LOSS' | 'TAKE_PROFIT';

export interface OrderRule {
    id: string;
    stockName: string;
    type: OrderRuleType;
    triggerPrice: number;
    quantity?: number;
    isActive: boolean;
    createdAt: string;
    triggeredAt?: string;
}

export const addOrderRule = (
    stockName: string,
    type: OrderRuleType,
    triggerPrice: number,
    quantity?: number
): GenericAction => ({
    type: ADD_ORDER_RULE,
    payload: {
        stockName,
        type,
        triggerPrice,
        quantity
    }
});

export const deactivateOrderRule = (id: string): GenericAction => ({
    type: DEACTIVATE_ORDER_RULE,
    payload: { id }
});

export const removeOrderRule = (id: string): GenericAction => ({
    type: REMOVE_ORDER_RULE,
    payload: { id }
});
