# Stocks Configuration Guide

## Overview
All pre-installed stocks are managed in `stocks.json`. This file is automatically loaded when the application starts and provides the base list of stocks available in the stock market simulation.

## File Location
`src/state/stockMarket/stocks.json`

## Stock Properties

Each stock object must have the following properties:

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `name` | string | The stock ticker or company name | "Apple", "Tesla", "Swiss Life AG" |
| `value` | number | Initial stock price (decimal allowed) | 185.11 |
| `volatility` | number | How much the stock price fluctuates (higher = more volatile) | 0.5 (low), 1 (medium), 2-3 (high) |
| `type` | string | Stock category/sector | "Technology", "Finance", "Energy", "Raw Materials", "Fire Arms" |

## Adding a Stock

1. Open `stocks.json`
2. Add a new object to the array:

```json
{
  "name": "Microsoft",
  "value": 290.50,
  "volatility": 1,
  "type": "Technology"
}
```

3. Save the file
4. Restart the application

## Removing a Stock

1. Open `stocks.json`
2. Delete the entire stock object (including the comma if not the last item)
3. Save the file
4. Restart the application

## Editing a Stock

1. Open `stocks.json`
2. Modify any property:
   - `name`: Change the stock's display name
   - `value`: Adjust initial price
   - `volatility`: Change price fluctuation rate
   - `type`: Change category

```json
{
  "name": "Updated Name",
  "value": 200.00,
  "volatility": 2.5,
  "type": "Technology"
}
```

3. Save and restart

## Volatility Guide

- **0.5**: Low volatility (stable stocks like utilities)
- **1.0**: Medium volatility (normal tech/finance stocks)
- **1.5**: Medium-high volatility
- **2.0**: High volatility (risky stocks)
- **3.0**: Very high volatility (highly speculative stocks)

## Stock Categories

Common types include:
- Technology
- Finance
- Energy
- Raw Materials
- Fire Arms
- Or any custom category name

## Example: Complete stocks.json Structure

```json
[
  {
    "name": "Apple",
    "value": 185.11,
    "volatility": 0.5,
    "type": "Technology"
  },
  {
    "name": "Tesla",
    "value": 348.66,
    "volatility": 1,
    "type": "Technology"
  },
  {
    "name": "Swiss Life AG",
    "value": 345.44,
    "volatility": 0.1,
    "type": "Finance"
  }
]
```

## Notes

- **JSON Format**: The file must be valid JSON. Each object must be comma-separated (except the last one).
- **Restart Required**: Changes take effect after restarting the application.
- **Custom Stocks**: Users can also add stocks dynamically through the UI. These are stored separately in Redux state and are marked as `custom: true`.
- **Pre-installed vs Custom**: Pre-installed stocks from `stocks.json` have `custom: false`, while user-added stocks have `custom: true` and can be deleted from the AddStockCard UI.
