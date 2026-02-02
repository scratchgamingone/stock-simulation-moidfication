# Stockmarket Simulation - Modified Version

> **🔗 Original Project:** This is a modified version of [stockmarket-simulation](https://github.com/stockmarkat/stockmarket-simulation) by [stockmarkat](https://github.com/stockmarkat). Full credit to the original creators for the base simulation.

[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/stockmarkat/stockmarket-simulation/issues)
[![Build Status](https://travis-ci.org/stockmarkat/stockmarket-simulation.svg?branch=master)](https://travis-ci.org/stockmarkat/stockmarket-simulation)
[![Maintainability](https://api.codeclimate.com/v1/badges/1b146f1983bf715406e3/maintainability)](https://codeclimate.com/github/stockmarkat/stockmarket-simulation/maintainability)

> **✨ Modernized for 2026!** Now compatible with Node.js v16-v24+ using React 17 + react-scripts 5. No Python required!

This is a Stockmarket Simulation.

At the start of the simulation the user has a capital of $ 10 000 that he can invest into various stocks. Ultimately, the user's goal should be to trade the stock as intelligently as possible in order to own as much money as they can. In spite of this goal, the user should pay attention to what he or she is effecting with his or her investment, especially with morally questionable companies. 

- The price of all stocks change in real time and the the category of a stock determines how volatile its price is. 
- There are various quests that offer an incentive to buy certain stocks or stock categories.
- The simulation can be terminated at any time and then restarted with the same status.

## Where can I try it out?
Click [Here](https://stockmarket.netlify.com/)!

## Screenshots

### Depot page

![depot overview](https://user-images.githubusercontent.com/16801528/47589807-938c3400-d96a-11e8-8619-1023d8b3bb9c.jpg)

### Market page

![market overview](https://user-images.githubusercontent.com/16801528/47589730-45773080-d96a-11e8-8f13-04a9f0d930a6.jpg)

### Quest page 

![quest overview](https://user-images.githubusercontent.com/16801528/47589834-a6066d80-d96a-11e8-80f6-50713ea95fb0.jpg)


## Run locally

### Node.js Compatibility

**✅ Works with ALL modern Node.js versions:**
- Node.js v16, v18, v20 LTS (Long Term Support)
- Node.js v22, v24+ (Latest)
- No Python or native compilation required!

### Quick Start (Windows)
Simply double-click the `setup-and-run.bat` file in the root directory. This will:
- Check if Node.js is installed (v16+)
- Install Yarn if not present
- Clean up any old dependencies automatically
- Install all project dependencies with modern React 18 & react-scripts 5
- Start the development server
- Automatically open the application in your default browser at http://localhost:3000

**✨ Automatically detects and cleans up old installations!**

### Manual Setup
Install Node.js (https://nodejs.org/), then run:

```bash
# Install Yarn globally (if not already installed)
npm install -g yarn

# Install project dependencies
yarn install

# Run the application
yarn start
```

After running `yarn start`, the application will automatically open in your browser at http://localhost:3000

### Available Commands

- `yarn test` - Run tests
- `yarn start` - Start the development server (opens at http://localhost:3000)
- `yarn build` - Create a production build
- `yarn storybook` - Test the components with [Storybook](https://github.com/storybooks/storybook)

## Live Stock Market Data Integration

This simulation supports integration with real-time stock market data APIs!

### Setup API Access (Optional)

1. **Get a FREE API Key** from one of these providers:
   - **Finnhub** (Recommended): https://finnhub.io/register
     - Free tier: 60 API calls/minute
   - **Alpha Vantage** (Alternative): https://www.alphavantage.co/support/#api-key
     - Free tier: 5 API calls/minute, 500 calls/day

2. **Create `.env` file** in the project root:
   ```bash
   # Copy the example file
   copy .env.example .env
   ```

3. **Add your API key** to the `.env` file:
   ```bash
   # For Finnhub (recommended)
   REACT_APP_FINNHUB_API_KEY=your_finnhub_api_key_here
   REACT_APP_USE_LIVE_DATA=true
   
   # OR for Alpha Vantage
   REACT_APP_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
   REACT_APP_USE_LIVE_DATA=true
   ```

4. **Restart the development server** for changes to take effect

### API Features

- **Automatic Fallback**: If live data is unavailable, the simulation uses realistic simulated data
- **Rate Limiting**: Built-in delays to respect API rate limits
- **Real Stock Symbols**: Maps simulation stocks to real market symbols (e.g., Apple → AAPL)
- **Multiple Providers**: Supports Finnhub and Alpha Vantage APIs

### Supported Stocks

The simulation maps these companies to real stock symbols:
- Apple (AAPL)
- Microsoft (MSFT)
- Google (GOOGL)
- Amazon (AMZN)
- Tesla (TSLA)
- Netflix (NFLX)
- Spotify (SPOT)
- And more...

## Contribute

Any type of feedback, pull request or issue is welcome. Follow the "Run locally" section of this documentation to learn how to debug the project.

## Troubleshooting

Having issues? Check out the [Troubleshooting Guide](TROUBLESHOOTING.md) for solutions to common problems.

## License
[MIT](https://tldrlegal.com/license/mit-license)
