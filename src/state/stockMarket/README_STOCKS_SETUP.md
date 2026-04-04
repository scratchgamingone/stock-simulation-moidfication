# Pre-installed Stocks Setup - Complete Guide

## 📁 Files Location
All stock configuration files are located in: `src/state/stockMarket/`

### Files Overview

| File | Purpose |
|------|---------|
| **stocks.json** | Main JSON file containing all 24 pre-installed stocks |
| **STOCKS_README.md** | Detailed guide for adding/removing/editing stocks |
| **CURRENT_STOCKS.md** | Quick reference list of all current stocks organized by category |
| **STOCK_TEMPLATES.md** | Copy-paste templates for quickly adding new stocks |

## 🚀 Quick Start

### Adding a Stock
1. Open `src/state/stockMarket/stocks.json`
2. Add a new object before the closing `]`:
```json
{
  "name": "Your Stock",
  "value": 150.00,
  "volatility": 1,
  "type": "Technology"
}
```
3. Save the file
4. Restart the application

### Removing a Stock
1. Open `stocks.json`
2. Delete the stock object and its comma
3. Save and restart

### Editing a Stock
1. Find the stock in `stocks.json`
2. Change any property (name, value, volatility, type)
3. Save and restart

## 📊 Stock Properties

| Property | Type | Range | Description |
|----------|------|-------|-------------|
| name | string | - | Stock ticker or company name |
| value | number | $10 - $2500 | Initial price |
| volatility | number | 0.1 - 3.0 | Price fluctuation rate (higher = more volatile) |
| type | string | - | Category (Technology, Finance, Energy, etc.) |

## 🎯 Volatility Reference

- **0.1 - 0.5**: Very stable (utilities, large-cap stocks)
- **1.0 - 1.5**: Average volatility (tech, finance stocks)
- **2.0 - 3.0**: High volatility (speculative, risky stocks)

## 📈 Current Statistics

- **Total Stocks**: 24
- **Categories**: 5 (Technology, Finance, Energy, Raw Materials, Fire Arms)
- **Price Range**: $20.01 - $2,210.03
- **Average Volatility**: ~1.4

## 🔧 How It Works

1. Application loads `stocks.json` at startup via `stockMarketSaga.ts`
2. Each stock is marked with `custom: false` (pre-installed)
3. Users can add additional stocks through the UI (marked as `custom: true`)
4. All stocks work with the existing buy/sell/delete functionality

## ✨ Features

✅ Easy JSON-based configuration
✅ No code changes required to add/remove stocks
✅ Support for unlimited stocks
✅ Custom stock categories
✅ Price volatility control
✅ Pre-installed vs user-added stock distinction

## 📝 Next Steps

1. Review `CURRENT_STOCKS.md` to see what stocks are loaded
2. Check `STOCK_TEMPLATES.md` for copy-paste examples
3. Read `STOCKS_README.md` for detailed editing instructions
4. Edit `stocks.json` to customize your stock list
5. Restart the application to load changes

## 🐛 Troubleshooting

**Issue**: Stocks not loading
- ✅ Check `stocks.json` is valid JSON (use online JSON validator)
- ✅ Ensure application is restarted after changes
- ✅ Check browser console for errors

**Issue**: Stock prices showing as NaN
- ✅ Verify `value` is a valid number in JSON

**Issue**: Changes not appearing
- ✅ Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- ✅ Clear browser cache and restart
- ✅ Restart development server

## 📚 Documentation

- [STOCKS_README.md](STOCKS_README.md) - Full editing guide
- [CURRENT_STOCKS.md](CURRENT_STOCKS.md) - Current stock list
- [STOCK_TEMPLATES.md](STOCK_TEMPLATES.md) - Quick templates
