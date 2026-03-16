# Feature Roadmap (2026)

This roadmap converts the complete requested feature list into phased, shippable milestones.

## Phase 1 — Trading + Risk Core (MVP)

- Stop-loss and take-profit orders
- Price/volume alerts and alert center
- Portfolio benchmark comparison
- Drawdown and Sharpe analytics cards
- Daily quest + streak rewards
- Backup restore browser + restore audit log

### Technical slices

- State: `orders`, `alerts`, `riskMetrics`, `benchmarks`
- Services: alert evaluator loop, benchmark feed adapter
- UI: order form upgrades, alert center panel, analytics risk widgets
- Persistence: redux-persist migration for new slices

## Phase 2 — Realism + Strategy Engine

- Limit/stop/trailing order variants and partial fills
- Slippage/liquidity market simulation model
- Earnings/macroeconomic event shock engine
- Strategy backtesting (momentum, mean reversion, DCA)
- Trade journal + setup tagging analytics

### Technical slices

- State: `strategy`, `events`, `journal`
- Services: event scheduler, backtest runner
- UI: strategy builder panel, journal entries on transactions

## Phase 3 — Progression + Economy

- XP levels, achievement tiers, unlockables
- Scenario missions (crash/recovery) and challenge modes
- Economy systems (fees, taxes, borrowing interest)
- Prestige / New Game+ loop

### Technical slices

- State: `progression`, `economy`, `scenario`
- Services: payout engine, mission generator

## Phase 4 — Social + Operations

- Leaderboards and seasonal competitions
- Team portfolio challenges
- Feature flags and balancing/admin panel
- Telemetry dashboard and error/reporting center

### Technical slices

- Optional backend endpoints for shared rankings
- Feature-flag config gating for rollout safety

---

## Recommended Public API Keys

Use any subset; app now supports multiple fallback providers for live quotes.

### Market quote/history providers

1. Finnhub — https://finnhub.io/register  
   Suggested env: `REACT_APP_FINNHUB_API_KEY`
2. Alpha Vantage — https://www.alphavantage.co/support/#api-key  
   Suggested env: `REACT_APP_ALPHA_VANTAGE_API_KEY`
3. Twelve Data — https://twelvedata.com/  
   Suggested env: `REACT_APP_TWELVE_DATA_API_KEY`
4. Polygon.io — https://polygon.io/  
   Suggested env: `REACT_APP_POLYGON_API_KEY`

### Optional news/sentiment providers (future phase)

1. Marketaux — https://www.marketaux.com/
2. NewsAPI — https://newsapi.org/
3. Finnhub News/Sentiment endpoints (same Finnhub key)
4. Alpha Vantage News & Sentiment endpoint (same Alpha key)

## Security and setup notes

- Never commit real keys to git.
- Keep keys in `.env.local` for local use.
- Restart dev server after changing env values.
- Provider free-tier limits can change; verify current quotas in provider docs.
