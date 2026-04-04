import { AppState } from '../AppState';

export const getAlertRules = (state: AppState) => state.alerts.rules;
export const getActiveAlertRules = (state: AppState) => state.alerts.rules.filter((rule) => rule.isActive);
export const getAlertEvents = (state: AppState) => state.alerts.events;
