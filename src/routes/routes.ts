import Depot from '../views/Depot';
import Market from '../views/Market';
import StockManagement from '../views/StockManagement';
import EarningMoney from '../views/EarningMoney';
import Upgrades from '../views/Upgrades';
import Quests from '../views/Quests';
import Transactions from '../views/Transactions';
import DataManagement from '../views/DataManagement';
import Gambling from '../views/Gambling';
import Analytics from '../views/Analytics';
import FormulaGraphs from '../views/FormulaGraphs';
import ProjectReport from '../views/ProjectReport';

export interface AppRoute {
    path: string;
    name: string;
    icon?: string;
    // tslint:disable-next-line no-any
    component?: any;
    upgrade?: boolean;
    redirect?: boolean;
    to?: string;
}

const appRoutes: AppRoute[] = [
    { path: '/depot', name: 'Depot', icon: 'pe-7s-wallet', component: Depot },
    { path: '/market', name: 'Market', icon: 'pe-7s-graph1', component: Market },
    { path: '/stock-management', name: 'Stock Management', icon: 'pe-7s-tools', component: StockManagement },
    { path: '/earning-money', name: 'Earning Money', icon: 'pe-7s-piggy', component: EarningMoney },
    { path: '/upgrades', name: 'Upgrades', icon: 'pe-7s-shine', component: Upgrades },
    { path: '/analytics', name: 'Analytics', icon: 'pe-7s-graph2', component: Analytics },
    { path: '/formula-graphs', name: 'Formula Graphs', icon: 'pe-7s-graph3', component: FormulaGraphs },
    { path: '/project-report', name: 'Project Report', icon: 'pe-7s-note2', component: ProjectReport },
    { path: '/quests', name: 'Quests', icon: 'pe-7s-note2', component: Quests },
    { path: '/transactions', name: 'Transactions', icon: 'pe-7s-news-paper', component: Transactions },
    { path: '/gambling', name: 'Gambling', icon: 'pe-7s-rocket', component: Gambling },
    { path: '/data', name: 'Data Management', icon: 'pe-7s-diskette', component: DataManagement },
    { path: '/', name: 'Depot', redirect: true, to: '/depot'},
];

export default appRoutes;