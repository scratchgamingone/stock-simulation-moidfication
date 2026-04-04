import { GenericAction } from '../AppState';
import { BUY_UPGRADE, SetUpgradesAction, SET_UPGRADES, Upgrade } from './upgradesActions';

export interface UpgradesState {
    upgrades: Upgrade[];
}

const initialUpgrades: Upgrade[] = [
    {
        id: 'boost-1',
        name: 'Money Boost I',
        description: 'Increase earnings by 25%',
        cost: 500,
        level: 0,
        maxLevel: 5,
        multiplier: 1.25
    },
    {
        id: 'boost-2',
        name: 'Money Boost II',
        description: 'Increase earnings by 50%',
        cost: 1500,
        level: 0,
        maxLevel: 5,
        multiplier: 1.50
    },
    {
        id: 'boost-3',
        name: 'Premium Simulator',
        description: 'Increase earnings by 100%',
        cost: 5000,
        level: 0,
        maxLevel: 3,
        multiplier: 2.0
    },
    {
        id: 'lucky-charm',
        name: 'Lucky Charm',
        description: 'Increase max earning amount by 50%',
        cost: 2000,
        level: 0,
        maxLevel: 5,
        multiplier: 1.5
    },
    {
        id: 'goldmine',
        name: 'Goldmine Access',
        description: 'Double your earning potential',
        cost: 10000,
        level: 0,
        maxLevel: 2,
        multiplier: 2.5
    },
    {
        id: 'crypto-miner',
        name: 'Crypto Miner',
        description: 'Increase earnings by 75%',
        cost: 3000,
        level: 0,
        maxLevel: 4,
        multiplier: 1.75
    }
];

const initialState: UpgradesState = {
    upgrades: initialUpgrades
};

const upgradesReducer = (state = initialState, action: GenericAction) => {
    switch (action.type) {
        case SET_UPGRADES: {
            const { upgrades } = action as SetUpgradesAction;
            return {
                ...state,
                upgrades
            };
        }

        case BUY_UPGRADE: {
            const { upgradeId } = action as any;
            const upgraded = state.upgrades.map(upgrade => {
                if (upgrade.id === upgradeId && upgrade.level < upgrade.maxLevel) {
                    return {
                        ...upgrade,
                        level: upgrade.level + 1,
                        cost: Math.floor(upgrade.cost * 1.15) // Increase cost by 15% for next level
                    };
                }
                return upgrade;
            });

            return {
                ...state,
                upgrades: upgraded
            };
        }

        default:
            return state;
    }
};

export default upgradesReducer;
