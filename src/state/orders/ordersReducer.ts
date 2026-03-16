import { cloneState, GenericAction } from '../AppState';
import {
    ADD_ORDER_RULE,
    DEACTIVATE_ORDER_RULE,
    OrderRule,
    REMOVE_ORDER_RULE
} from './ordersActions';

export interface OrdersState {
    rules: OrderRule[];
}

const initialState: OrdersState = {
    rules: []
};

const ordersReducer = (state = initialState, action: GenericAction): OrdersState => {
    switch (action.type) {
        case ADD_ORDER_RULE: {
            const { stockName, type, triggerPrice, quantity } = action.payload || {};
            const validTriggerPrice = Number(triggerPrice);
            const validQuantity = Number(quantity);

            if (!stockName || !Number.isFinite(validTriggerPrice) || validTriggerPrice <= 0) {
                return state;
            }

            const clone = cloneState(state);
            clone.rules.push({
                id: `${stockName}-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                stockName,
                type,
                triggerPrice: Number(validTriggerPrice.toFixed(2)),
                quantity: Number.isFinite(validQuantity) && validQuantity > 0 ? Math.floor(validQuantity) : undefined,
                isActive: true,
                createdAt: new Date().toISOString()
            });

            return clone;
        }

        case DEACTIVATE_ORDER_RULE: {
            const { id } = action.payload || {};
            if (!id) {
                return state;
            }

            const clone = cloneState(state);
            const index = clone.rules.findIndex((rule) => rule.id === id);
            if (index === -1) {
                return state;
            }

            clone.rules[index].isActive = false;
            clone.rules[index].triggeredAt = new Date().toISOString();
            return clone;
        }

        case REMOVE_ORDER_RULE: {
            const { id } = action.payload || {};
            if (!id) {
                return state;
            }

            return {
                ...state,
                rules: state.rules.filter((rule) => rule.id !== id)
            };
        }

        default:
            return state;
    }
};

export default ordersReducer;
