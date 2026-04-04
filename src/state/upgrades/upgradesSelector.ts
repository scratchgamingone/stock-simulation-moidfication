import { AppState } from '../AppState';

export const getUpgrades = (state: AppState) => state.upgrades.upgrades;

export const getTotalEarningsMultiplier = (state: AppState) => {
    const upgrades = getUpgrades(state);
    let totalMultiplier = 1;
    
    upgrades.forEach(upgrade => {
        if (upgrade.level > 0) {
            totalMultiplier *= Math.pow(upgrade.multiplier, upgrade.level);
        }
    });
    
    return totalMultiplier;
};

export const getUpgradeById = (state: AppState, upgradeId: string) => {
    const upgrades = getUpgrades(state);
    return upgrades.find(u => u.id === upgradeId);
};
