# Analytics Dashboard - User Guide

## Overview

The **Analytics** dashboard is a comprehensive stock market analysis tool that provides:

- 📊 **Transaction Timeline Visualization** - See your buy/sell activity over time
- 🏆 **Top 20 Popular Stocks** - Track the most traded stocks in your portfolio
- 📈 **Historical Stock Data** - View detailed price history from real market data
- 🔮 **Price Predictions** - AI-powered future price forecasts
- 💼 **Portfolio Distribution** - Visual breakdown of your holdings
- 📉 **Transaction Analysis** - Detailed statistics on your trading activity

## Features

### 1. Transaction Volume Timeline

A dual-line chart showing:
- **Buy Volume** (green line): Total value of purchase transactions
- **Sell Volume** (red line): Total value of sell transactions
- Organized by date to track your trading patterns

### 2. Portfolio Distribution

Interactive pie chart displaying:
- Current holdings by stock
- Proportional representation of portfolio allocation
- Color-coded segments for easy identification

### 3. Transaction Type Distribution

Shows the ratio between:
- Total buy transactions
- Total sell transactions
- Helps understand your trading behavior

### 4. Top 20 Most Popular Stocks

A ranked table featuring:
- **Rank**: Position based on total transaction volume
- **Stock Name**: Company identifier
- **Buy Count**: Number of purchase transactions
- **Sell Count**: Number of sell transactions
- **Total Volume**: Combined value of all transactions
- **Net Shares**: Current position (positive = long, negative = short)
- **Current Price**: Latest stock value
- **View History Button**: Load historical data and predictions

### 5. Historical Data & Predictions

For each stock you can view:

#### Historical Price Chart
- Configurable time ranges: 1D, 1W, 1M, 3M, 1Y
- Real market data from Finnhub or Alpha Vantage APIs
- Interactive tooltips with exact prices
- Smooth line visualization with filled area

#### Price Predictions
- 7-day forward-looking price forecast
- Based on linear regression analysis
- Confidence intervals displayed
- Trend indicator (Up/Down/Stable)
- Dashed line to distinguish from historical data

## How to Use

### Viewing Transaction Timeline

1. Navigate to **Analytics** from the main menu (graph icon)
2. The timeline automatically loads all your transactions
3. Hover over data points to see exact values
4. The chart updates in real-time as you make new transactions

### Analyzing Popular Stocks

1. Scroll to the "Top 20 Most Popular Stocks" table
2. Stocks are automatically ranked by trading volume
3. Click **"View History"** on any stock to load detailed analysis

### Loading Historical Data

1. Click "View History" next to any stock in the Top 20 table
2. Historical data loads from your configured API
3. Select different time ranges (1D, 1W, 1M, 3M, 1Y) using the buttons
4. The chart updates automatically with the selected time frame

### Understanding Predictions

1. Predictions appear as a dashed line continuation of the historical chart
2. The line represents expected price movement over the next 7 days
3. Confidence decreases over time (first days more reliable)
4. Use predictions as guidance, not guaranteed outcomes

## API Configuration

### Setting Up Your API Keys

1. **Get API Keys** (Choose one or both):
   - **Finnhub** (Recommended): https://finnhub.io/register
     - 60 calls/minute free
     - Real-time data
     - Better rate limits
   
   - **Alpha Vantage** (Alternative): https://www.alphavantage.co/support/#api-key
     - 5 calls/minute, 500/day free
     - Historical data
     - Backup option

2. **Configure Environment Variables**:
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your keys
   REACT_APP_FINNHUB_API_KEY=your_actual_key_here
   REACT_APP_ALPHA_VANTAGE_API_KEY=your_actual_key_here
   REACT_APP_USE_LIVE_DATA=true
   ```

3. **Restart the application** for changes to take effect

### API Features

- **Historical Data**: Fetches real market prices for selected time ranges
- **Multiple Sources**: Automatically falls back to Alpha Vantage if Finnhub fails
- **Rate Limiting**: Built-in delays to respect API limits
- **Caching**: Smart caching to minimize API calls

### Without API Keys

The Analytics dashboard works without API keys:
- Transaction timeline still functions
- Portfolio distribution still displays
- Top 20 stocks ranking still available
- Historical data and predictions show "API not configured" message

## Technical Details

### Prediction Algorithm

The price prediction uses **linear regression** with the following approach:

1. **Data Collection**: Uses last 14 data points from historical data
2. **Trend Calculation**: Computes slope and intercept
3. **Forecast Generation**: Projects 7 days forward
4. **Variance Addition**: Adds ±2% random variation for realism
5. **Confidence Decay**: Confidence decreases with forecast distance

**Note**: This is a simplified model for demonstration. Production systems should use:
- Machine learning models (LSTM, Prophet)
- Multiple indicators (RSI, MACD, Bollinger Bands)
- Sentiment analysis
- Market fundamental data

### Data Updates

- **Real-time**: Transaction data updates immediately after trades
- **Periodic**: Stock prices update based on your configured interval
- **On-demand**: Historical data fetched when you click "View History"

### Performance

- Charts render with hardware acceleration
- Data is memoized to prevent unnecessary re-renders
- API calls are throttled to respect rate limits
- Large datasets are automatically paginated

## Troubleshooting

### "No transactions to display"

**Cause**: You haven't made any buy or sell transactions yet

**Solution**: Go to the Market view and buy some stocks

### "API key not configured"

**Cause**: Environment variables not set or live data disabled

**Solution**: 
1. Check your `.env` file has valid API keys
2. Ensure `REACT_APP_USE_LIVE_DATA=true`
3. Restart the application

### "No historical data available"

**Cause**: API request failed or stock symbol not mapped

**Solution**:
1. Check your internet connection
2. Verify API key is valid
3. Check console for error messages
4. Try a different stock

### Charts not displaying

**Cause**: Browser compatibility or Chart.js not loaded

**Solution**:
1. Clear browser cache
2. Ensure you're using a modern browser (Chrome, Firefox, Edge)
3. Check browser console for errors
4. Reinstall dependencies: `npm install`

### Rate limit exceeded

**Cause**: Too many API calls in short time

**Solution**:
1. Wait a few minutes before trying again
2. Use longer time ranges to reduce calls
3. Consider upgrading to a paid API plan for higher limits

## Tips & Best Practices

1. **Start with simulated data**: Set `REACT_APP_USE_LIVE_DATA=false` initially to learn the interface

2. **Use appropriate time ranges**: 
   - 1D for day trading analysis
   - 1W-1M for swing trading
   - 3M-1Y for long-term trends

3. **Monitor popular stocks**: The Top 20 list helps identify your most active positions

4. **Compare predictions with actual**: Track prediction accuracy to build intuition

5. **Diversify analysis**: Don't rely solely on predictions; consider fundamentals

6. **Export data**: Use the Data Management section to backup your transaction history

## Future Enhancements

Potential features for future versions:
- Advanced ML prediction models
- Real-time news sentiment analysis
- Social media trend integration
- Technical indicator overlays (RSI, MACD)
- Comparative stock analysis
- Export charts as images
- Custom date range selection
- Portfolio performance metrics
- Risk analysis tools
- Correlation heatmaps

## Support

For issues or questions:
1. Check the TROUBLESHOOTING.md file
2. Review the GitHub Issues page
3. Consult API provider documentation
4. Refer to the main README.md

---

**Note**: Stock market predictions are inherently uncertain. Use this tool for educational purposes and always do thorough research before making real investment decisions.
