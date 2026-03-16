const fs = require('fs');
const http = require('http');
const path = require('path');
const axios = require('axios');

const PORT = Number(process.env.BACKGROUND_TRACKER_PORT || 4010);
const UPDATE_INTERVAL_MS = Number(process.env.BACKGROUND_TRACKER_INTERVAL_MS || 120000);
const HOST = '127.0.0.1';

const STATE_FILE_PATH = path.join(__dirname, '..', 'backup', 'background-tracker-state.json');
const ENV_FILE_PATH = path.join(__dirname, '..', '.env');

const SYMBOL_MAP = {
    'Swiss Life AG': 'SLHN.SW',
    'Spotify': 'SPOT',
    'SolarCity': 'TSLA',
    'UBS AG': 'UBS',
    'SHELL': 'SHEL',
    'Card Services AG': 'V',
    'Apple': 'AAPL',
    'Samsung': '005930.KS',
    'Nestlé': 'NESN.SW',
    'Microsoft': 'MSFT',
    'Amazon': 'AMZN',
    'Google': 'GOOGL',
    'Facebook': 'META',
    'Tesla': 'TSLA',
    'Netflix': 'NFLX'
};

function readEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const result = {};

    content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            return;
        }

        const eqIndex = trimmed.indexOf('=');
        if (eqIndex <= 0) {
            return;
        }

        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
            value = value.slice(1, -1);
        }

        result[key] = value;
    });

    return result;
}

const envFromFile = readEnvFile(ENV_FILE_PATH);
const FINNHUB_API_KEY = process.env.REACT_APP_FINNHUB_API_KEY || envFromFile.REACT_APP_FINNHUB_API_KEY || '';
const ALPHA_VANTAGE_API_KEY = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY || envFromFile.REACT_APP_ALPHA_VANTAGE_API_KEY || '';

function ensureStateFile() {
    const backupDir = path.dirname(STATE_FILE_PATH);
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    if (!fs.existsSync(STATE_FILE_PATH)) {
        const initialState = {
            version: 1,
            updatedAt: null,
            lastPortfolioSyncAt: null,
            stocks: []
        };
        fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(initialState, null, 2), 'utf8');
    }
}

function loadState() {
    ensureStateFile();
    try {
        const raw = fs.readFileSync(STATE_FILE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.stocks)) {
            throw new Error('Invalid tracker state format');
        }
        return parsed;
    } catch (error) {
        console.error('[TRACKER] Failed to read state, recreating file:', error.message);
        const fallback = {
            version: 1,
            updatedAt: null,
            lastPortfolioSyncAt: null,
            stocks: []
        };
        fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(fallback, null, 2), 'utf8');
        return fallback;
    }
}

function saveState(state) {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function inferSymbol(stockName) {
    if (SYMBOL_MAP[stockName]) {
        return SYMBOL_MAP[stockName];
    }

    if (/^[A-Z0-9.\-]{1,15}$/.test(stockName)) {
        return stockName;
    }

    return null;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchStockQuoteFinnhub(symbol) {
    if (!FINNHUB_API_KEY) {
        return null;
    }

    try {
        const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`, {
            timeout: 10000
        });

        if (response.data && typeof response.data.c === 'number' && response.data.c > 0) {
            return response.data.c;
        }
    } catch (error) {
        console.warn(`[TRACKER] Finnhub quote failed for ${symbol}:`, error.message);
    }

    return null;
}

async function fetchStockQuoteAlphaVantage(symbol) {
    if (!ALPHA_VANTAGE_API_KEY) {
        return null;
    }

    try {
        const response = await axios.get('https://www.alphavantage.co/query', {
            timeout: 12000,
            params: {
                function: 'GLOBAL_QUOTE',
                symbol,
                apikey: ALPHA_VANTAGE_API_KEY
            }
        });

        const priceRaw = response.data && response.data['Global Quote'] && response.data['Global Quote']['05. price'];
        const price = Number(priceRaw);
        if (Number.isFinite(price) && price > 0) {
            return price;
        }
    } catch (error) {
        console.warn(`[TRACKER] Alpha Vantage quote failed for ${symbol}:`, error.message);
    }

    return null;
}

async function fetchLivePrice(symbol) {
    const finnhubPrice = await fetchStockQuoteFinnhub(symbol);
    if (finnhubPrice !== null) {
        return finnhubPrice;
    }

    return fetchStockQuoteAlphaVantage(symbol);
}

function sanitizePortfolioStocks(payloadStocks) {
    if (!Array.isArray(payloadStocks)) {
        return [];
    }

    return payloadStocks
        .map((stock) => {
            const name = typeof stock.name === 'string' ? stock.name.trim() : '';
            const quantity = Number(stock.quantity || 0);
            const lastKnownPrice = Number(stock.value || 0);
            if (!name) {
                return null;
            }

            return {
                name,
                symbol: inferSymbol(name),
                quantity: Number.isFinite(quantity) ? quantity : 0,
                lastKnownPrice: Number.isFinite(lastKnownPrice) && lastKnownPrice > 0 ? lastKnownPrice : 0,
                livePrice: Number.isFinite(lastKnownPrice) && lastKnownPrice > 0 ? lastKnownPrice : null,
                marketValue: 0,
                updatedAt: new Date().toISOString()
            };
        })
        .filter(Boolean);
}

function mergePortfolio(state, sanitizedStocks) {
    const previousByName = new Map();
    state.stocks.forEach((stock) => {
        previousByName.set(stock.name, stock);
    });

    state.stocks = sanitizedStocks.map((incoming) => {
        const previous = previousByName.get(incoming.name);
        const livePrice = previous && Number.isFinite(previous.livePrice) && previous.livePrice > 0
            ? previous.livePrice
            : incoming.livePrice;
        const effectivePrice = livePrice || incoming.lastKnownPrice || 0;

        return {
            ...incoming,
            symbol: incoming.symbol || (previous ? previous.symbol : null),
            livePrice,
            marketValue: Number((incoming.quantity * effectivePrice).toFixed(2)),
            updatedAt: new Date().toISOString()
        };
    });

    state.lastPortfolioSyncAt = new Date().toISOString();
    saveState(state);
    return state;
}

async function refreshLivePrices() {
    const state = loadState();
    if (!state.stocks.length) {
        return;
    }

    const trackedStocks = state.stocks.filter((stock) => Number(stock.quantity) > 0 && stock.symbol);
    if (!trackedStocks.length) {
        state.updatedAt = new Date().toISOString();
        saveState(state);
        return;
    }

    for (const stock of trackedStocks) {
        try {
            const livePrice = await fetchLivePrice(stock.symbol);
            if (livePrice !== null) {
                stock.livePrice = Number(livePrice.toFixed(2));
                stock.lastKnownPrice = stock.livePrice;
                stock.marketValue = Number((stock.quantity * stock.livePrice).toFixed(2));
                stock.updatedAt = new Date().toISOString();
            }
        } catch (error) {
            console.warn(`[TRACKER] Failed to refresh ${stock.name}:`, error.message);
        }

        await sleep(1200);
    }

    state.updatedAt = new Date().toISOString();
    saveState(state);
}

function getPricesPayload() {
    const state = loadState();
    const prices = {};
    state.stocks.forEach((stock) => {
        const price = Number(stock.livePrice || stock.lastKnownPrice || 0);
        if (Number.isFinite(price) && price > 0) {
            prices[stock.name] = Number(price.toFixed(2));
        }
    });

    return {
        updatedAt: state.updatedAt,
        prices
    };
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(payload));
}

function collectRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 2 * 1024 * 1024) {
                reject(new Error('Request payload too large'));
            }
        });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

async function handleRequest(req, res) {
    if (req.method === 'OPTIONS') {
        sendJson(res, 200, { ok: true });
        return;
    }

    if (req.method === 'GET' && req.url === '/health') {
        sendJson(res, 200, {
            ok: true,
            service: 'background-price-tracker',
            updatedAt: loadState().updatedAt
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/prices') {
        sendJson(res, 200, getPricesPayload());
        return;
    }

    if (req.method === 'POST' && req.url === '/sync-portfolio') {
        try {
            const raw = await collectRequestBody(req);
            const payload = raw ? JSON.parse(raw) : {};
            const sanitizedStocks = sanitizePortfolioStocks(payload.stocks || []);
            const state = loadState();
            mergePortfolio(state, sanitizedStocks);

            sendJson(res, 200, {
                ok: true,
                trackedStocks: state.stocks.length,
                lastPortfolioSyncAt: state.lastPortfolioSyncAt
            });
        } catch (error) {
            sendJson(res, 400, {
                ok: false,
                error: error.message
            });
        }
        return;
    }

    if (req.method === 'POST' && req.url === '/refresh-now') {
        try {
            await refreshLivePrices();
            const state = loadState();
            sendJson(res, 200, {
                ok: true,
                updatedAt: state.updatedAt,
                trackedStocks: Array.isArray(state.stocks) ? state.stocks.length : 0
            });
        } catch (error) {
            sendJson(res, 500, {
                ok: false,
                error: error.message
            });
        }
        return;
    }

    sendJson(res, 404, {
        ok: false,
        error: 'Not found'
    });
}

function startUpdateLoop() {
    setInterval(async () => {
        try {
            await refreshLivePrices();
        } catch (error) {
            console.error('[TRACKER] Update loop failed:', error.message);
        }
    }, UPDATE_INTERVAL_MS);
}

async function bootstrap() {
    ensureStateFile();
    await refreshLivePrices();

    const server = http.createServer((req, res) => {
        handleRequest(req, res).catch((error) => {
            console.error('[TRACKER] Request handling failed:', error.message);
            sendJson(res, 500, {
                ok: false,
                error: 'Internal server error'
            });
        });
    });

    server.listen(PORT, HOST, () => {
        console.log(`[TRACKER] Background price tracker listening on http://${HOST}:${PORT}`);
        console.log(`[TRACKER] State file: ${STATE_FILE_PATH}`);
        if (!FINNHUB_API_KEY && !ALPHA_VANTAGE_API_KEY) {
            console.warn('[TRACKER] No API keys found. Tracker will keep last known prices only.');
        }
    });

    startUpdateLoop();
}

bootstrap().catch((error) => {
    console.error('[TRACKER] Fatal startup error:', error);
    process.exit(1);
});