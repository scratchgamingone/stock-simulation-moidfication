import { cloneState, GenericAction } from '../AppState';
import {
    ADD_ALERT_EVENT,
    ADD_ALERT_RULE,
    AlertEvent,
    AlertRule,
    CLEAR_ALERT_EVENTS,
    DEACTIVATE_ALERT_RULE,
    REMOVE_ALERT_RULE
} from './alertsActions';

export interface AlertsState {
    rules: AlertRule[];
    events: AlertEvent[];
}

const initialState: AlertsState = {
    rules: [],
    events: []
};

const alertsReducer = (state = initialState, action: GenericAction): AlertsState => {
    switch (action.type) {
        case ADD_ALERT_RULE: {
            const { stockName, type, threshold } = action.payload || {};
            const validThreshold = Number(threshold);

            if (!stockName || !Number.isFinite(validThreshold)) {
                return state;
            }

            const clone = cloneState(state);
            clone.rules.push({
                id: `${stockName}-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                stockName,
                type,
                threshold: Number(validThreshold.toFixed(2)),
                isActive: true,
                createdAt: new Date().toISOString()
            });

            return clone;
        }

        case DEACTIVATE_ALERT_RULE: {
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

        case REMOVE_ALERT_RULE: {
            const { id } = action.payload || {};
            if (!id) {
                return state;
            }

            return {
                ...state,
                rules: state.rules.filter((rule) => rule.id !== id)
            };
        }

        case ADD_ALERT_EVENT: {
            const { ruleId, stockName, message } = action.payload || {};
            if (!ruleId || !stockName || !message) {
                return state;
            }

            const clone = cloneState(state);
            clone.events.unshift({
                id: `${ruleId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                ruleId,
                stockName,
                message,
                createdAt: new Date().toISOString()
            });

            if (clone.events.length > 50) {
                clone.events = clone.events.slice(0, 50);
            }

            return clone;
        }

        case CLEAR_ALERT_EVENTS:
            return {
                ...state,
                events: []
            };

        default:
            return state;
    }
};

export default alertsReducer;
