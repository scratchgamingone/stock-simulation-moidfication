# 📊 Stock Management Index

Welcome to the Stock Configuration System! All pre-installed stocks are managed through JSON files in this directory.

## 🎯 Start Here

### 👤 For Users
**Want to add, remove, or edit stocks?**
- Start with: [README_STOCKS_SETUP.md](README_STOCKS_SETUP.md)
- Quick templates: [STOCK_TEMPLATES.md](STOCK_TEMPLATES.md)
- See current stocks: [CURRENT_STOCKS.md](CURRENT_STOCKS.md)

### 👨‍💻 For Developers
**Want to understand the code?**
- Check: `stockMarketSaga.ts` (loads stocks.json)
- Check: `stockMarketReducer.ts` (manages stock state)
- Check: `stocks.test.ts` (test file)

## 📁 File Structure

```
src/state/stockMarket/
├── stocks.json                    ← Main stock data file
├── stockMarketActions.ts          ← Redux actions
├── stockMarketReducer.ts          ← Redux reducer
├── stockMarketSaga.ts             ← Loads stocks.json
├── stockSelector.ts               ← Stock selectors
│
└── Documentation:
    ├── README_STOCKS_SETUP.md     ← Quick start guide
    ├── STOCKS_README.md           ← Detailed guide
    ├── CURRENT_STOCKS.md          ← Current stock list
    ├── STOCK_TEMPLATES.md         ← Copy-paste templates
    └── INDEX.md                   ← This file
```

## 🚀 Common Tasks

### ➕ Add a New Stock
1. Open `stocks.json`
2. Add stock object before closing `]`
3. Save and restart app

→ See [STOCKS_README.md](STOCKS_README.md#adding-a-stock) for details

### ➖ Remove a Stock
1. Open `stocks.json`
2. Delete stock object and comma
3. Save and restart app

→ See [STOCKS_README.md](STOCKS_README.md#removing-a-stock) for details

### ✏️ Edit a Stock
1. Open `stocks.json`
2. Modify any property
3. Save and restart app

→ See [STOCKS_README.md](STOCKS_README.md#editing-a-stock) for details

### 📋 View All Stocks
→ See [CURRENT_STOCKS.md](CURRENT_STOCKS.md) for organized list

### 📝 Copy-Paste Examples
→ See [STOCK_TEMPLATES.md](STOCK_TEMPLATES.md) for templates

## 📊 Current Status

- **Total Stocks**: 24 pre-installed
- **Format**: JSON (5 properties per stock)
- **Categories**: 5 types
- **Auto-load**: Yes (on application startup)

## 🎨 Stock Categories

| Category | Count | Examples |
|----------|-------|----------|
| Technology | 8 | Apple, Tesla, Samsung, Alphabet |
| Finance | 5 | Swiss Life, UBS, MasterCard |
| Energy | 4 | SolarCity, Axpo, Wind Power |
| Raw Materials | 5 | Shell, Holcim, Glencore |
| Fire Arms | 2 | TroubleShooters, Ruag |

## 🔑 Stock Properties

```json
{
  "name": "Stock Name",           // String
  "value": 150.00,                // Number (price)
  "volatility": 1.0,              // Number (0.1 - 3.0)
  "type": "Technology"            // String (category)
}
```

## ⚡ Quick Reference

| Action | File | Steps |
|--------|------|-------|
| Add Stock | stocks.json | Add object in JSON |
| Remove Stock | stocks.json | Delete object from JSON |
| Edit Stock | stocks.json | Modify properties |
| See List | CURRENT_STOCKS.md | Read markdown |
| Find Template | STOCK_TEMPLATES.md | Copy example |

## 🆘 Need Help?

1. **How do I add a stock?**
   → [STOCKS_README.md - Adding](STOCKS_README.md#adding-a-stock)

2. **What properties does a stock need?**
   → [STOCKS_README.md - Properties](STOCKS_README.md#stock-properties)

3. **What are the volatility ranges?**
   → [STOCKS_README.md - Volatility](STOCKS_README.md#volatility-guide)

4. **Can I see examples?**
   → [STOCK_TEMPLATES.md](STOCK_TEMPLATES.md)

5. **What stocks are currently loaded?**
   → [CURRENT_STOCKS.md](CURRENT_STOCKS.md)

## ✅ Checklist for Adding Stocks

- [ ] Stock object is valid JSON
- [ ] All 4 required properties present (name, value, volatility, type)
- [ ] Price value is a number (not a string)
- [ ] Volatility is between 0.1 and 3.0
- [ ] Comma added after each object (except last one)
- [ ] File ends with `]`
- [ ] No syntax errors in JSON
- [ ] Application restarted after changes

## 🎓 Learning Path

```
New to stocks configuration?
↓
Read: README_STOCKS_SETUP.md
↓
Check: CURRENT_STOCKS.md (see examples)
↓
View: STOCK_TEMPLATES.md (copy template)
↓
Edit: stocks.json (add your stock)
↓
Verify: JSON is valid
↓
Restart: Application
↓
Success! 🎉
```

---

**Last Updated**: January 2026
**Format**: JSON
**Reload Required**: Yes (restart application after changes)
