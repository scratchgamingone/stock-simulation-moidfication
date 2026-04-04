import axios from 'axios';
import { Stock } from '../state/AppState';

const TRACKER_URL = process.env.REACT_APP_BACKGROUND_TRACKER_URL || 'http://127.0.0.1:4010';
const TRACKER_ENABLED = process.env.REACT_APP_BACKGROUND_TRACKER_ENABLED !== 'false';

interface BackgroundPricesResponse {
    updatedAt?: string;
    prices?: { [stockName: string]: number };
}

export const isBackgroundTrackerEnabled = (): boolean => TRACKER_ENABLED;

export async function fetchBackgroundTrackedPrices(): Promise<Map<string, number>> {
    const map = new Map<string, number>();

    if (!TRACKER_ENABLED) {
        return map;
    }

    try {
        const response = await axios.get<BackgroundPricesResponse>(`${TRACKER_URL}/prices`, {
            timeout: 5000
        });

        const prices = response.data?.prices || {};
        Object.keys(prices).forEach((stockName) => {
            const price = Number(prices[stockName]);
            if (Number.isFinite(price) && price > 0) {
                map.set(stockName, price);
            }
        });
    } catch (error) {
        console.warn('[BACKGROUND TRACKER] Could not fetch background prices:', error);
    }

    return map;
}

export async function syncPortfolioToBackgroundTracker(stocks: Stock[]): Promise<void> {
    if (!TRACKER_ENABLED) {
        return;
    }

    const payload = {
        timestamp: new Date().toISOString(),
        stocks: stocks.map((stock) => ({
            name: stock.name,
            quantity: stock.quantity,
            value: stock.value
        }))
    };

    try {
        await axios.post(`${TRACKER_URL}/sync-portfolio`, payload, {
            timeout: 5000
        });
    } catch (error) {
        console.warn('[BACKGROUND TRACKER] Could not sync portfolio:', error);
    }
}
