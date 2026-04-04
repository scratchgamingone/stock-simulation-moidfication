import { put, select, takeEvery } from 'redux-saga/effects';
import { addNotification } from '../../components/NotificationSystem';
import { changeAccountValue } from '../depot/depotActions';
import { getAccountValue } from '../depot/depotSelector';
import { BUY_UPGRADE, EARN_MONEY } from './upgradesActions';
import { getUpgrades } from './upgradesSelector';
import { buyUpgrade } from './upgradesActions';

function getRandomEarnings(multiplier: number): number {
    // Base random from 1-1000
    const baseEarning = Math.floor(Math.random() * 1000) + 1;
    const finalEarning = Math.floor(baseEarning * multiplier);
    return finalEarning;
}

function* earnMoneySaga() {
    const upgrades = yield select(getUpgrades);
    
    // Calculate total multiplier from all upgrades
    let totalMultiplier = 1;
    upgrades.forEach((upgrade: any) => {
        if (upgrade.level > 0) {
            // Each level adds more multiplier
            totalMultiplier *= Math.pow(upgrade.multiplier, upgrade.level);
        }
    });
    
    const earnedAmount = getRandomEarnings(totalMultiplier);
    
    yield put(changeAccountValue(earnedAmount));
    
    addNotification({
        title: 'Money Earned!',
        message: `You earned $${earnedAmount.toFixed(2)}!`,
        level: 'success'
    });
}

function* buyUpgradeSaga(action: any) {
    const { upgradeId } = action;
    const upgrades = yield select(getUpgrades);
    const accountValue = yield select(getAccountValue);
    
    // Find the upgrade
    const upgrade = upgrades.find((u: any) => u.id === upgradeId);
    
    if (!upgrade) {
        addNotification({
            level: 'error',
            message: 'Upgrade not found'
        });
        return;
    }
    
    if (upgrade.level >= upgrade.maxLevel) {
        addNotification({
            level: 'error',
            message: `${upgrade.name} is already at maximum level`
        });
        return;
    }
    
    if (accountValue < upgrade.cost) {
        addNotification({
            level: 'error',
            message: `Not enough money. You need $${upgrade.cost.toFixed(2)}`
        });
        return;
    }
    
    // Deduct the cost
    yield put(changeAccountValue(-upgrade.cost));
    
    // Buy the upgrade
    yield put(buyUpgrade(upgradeId));
    
    addNotification({
        title: 'Upgrade Purchased!',
        message: `${upgrade.name} upgraded to level ${upgrade.level + 1}`,
        level: 'success'
    });
}

function* upgradesSaga() {
    yield takeEvery(EARN_MONEY, earnMoneySaga);
    yield takeEvery(BUY_UPGRADE, buyUpgradeSaga);
}

export default upgradesSaga;
