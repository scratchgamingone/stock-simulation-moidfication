import { GenericAction } from '../AppState';

export const ADD_ALERT_RULE = 'alertsReducer/add-alert-rule';
export const DEACTIVATE_ALERT_RULE = 'alertsReducer/deactivate-alert-rule';
export const REMOVE_ALERT_RULE = 'alertsReducer/remove-alert-rule';
export const ADD_ALERT_EVENT = 'alertsReducer/add-alert-event';
export const CLEAR_ALERT_EVENTS = 'alertsReducer/clear-alert-events';

export type AlertRuleType =
    'PRICE_ABOVE'
    | 'PRICE_BELOW'
    | 'VALUE_CHANGE_ABOVE'
    | 'VALUE_CHANGE_BELOW';

export interface AlertRule {
    id: string;
    stockName: string;
    type: AlertRuleType;
    threshold: number;
    isActive: boolean;
    createdAt: string;
    triggeredAt?: string;
}

export interface AlertEvent {
    id: string;
    ruleId: string;
    stockName: string;
    message: string;
    createdAt: string;
}

export const addAlertRule = (stockName: string, type: AlertRuleType, threshold: number): GenericAction => ({
    type: ADD_ALERT_RULE,
    payload: {
        stockName,
        type,
        threshold
    }
});

export const deactivateAlertRule = (id: string): GenericAction => ({
    type: DEACTIVATE_ALERT_RULE,
    payload: { id }
});

export const removeAlertRule = (id: string): GenericAction => ({
    type: REMOVE_ALERT_RULE,
    payload: { id }
});

export const addAlertEvent = (ruleId: string, stockName: string, message: string): GenericAction => ({
    type: ADD_ALERT_EVENT,
    payload: {
        ruleId,
        stockName,
        message
    }
});

export const clearAlertEvents = (): GenericAction => ({
    type: CLEAR_ALERT_EVENTS
});
