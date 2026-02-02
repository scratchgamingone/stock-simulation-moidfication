import { GenericAction } from '../AppState';

export const EARN_MONEY = 'upgrades/earn-money';
export const BUY_UPGRADE = 'upgrades/buy-upgrade';
export const SET_UPGRADES = 'upgrades/set-upgrades';

export interface EarnMoneyAction {
    type: string;
    amount: number;
}

export interface BuyUpgradeAction {
    type: string;
    upgradeId: string;
}

export interface SetUpgradesAction {
    type: string;
    upgrades: Upgrade[];
}

export interface Upgrade {
    id: string;
    name: string;
    description: string;
    cost: number;
    level: number;
    maxLevel: number;
    multiplier: number; // Multiplier for earning money
}

export const earnMoney = (): GenericAction => ({
    type: EARN_MONEY
});

export const buyUpgrade = (upgradeId: string): BuyUpgradeAction => ({
    type: BUY_UPGRADE,
    upgradeId
});

export const setUpgrades = (upgrades: Upgrade[]): SetUpgradesAction => ({
    type: SET_UPGRADES,
    upgrades
});
