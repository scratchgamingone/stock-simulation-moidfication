import { AppState } from '../AppState';

export const getOrderRules = (state: AppState) => state.orders.rules;
export const getActiveOrderRules = (state: AppState) => state.orders.rules.filter((rule) => rule.isActive);
