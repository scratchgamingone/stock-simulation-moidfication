# Stock JSON Templates

Quick copy-paste templates for common stock additions.

## Basic Template

```json
{
  "name": "Stock Name",
  "value": 100.00,
  "volatility": 1,
  "type": "Technology"
}
```

## Low Volatility Stock (Stable)

```json
{
  "name": "Stable Company",
  "value": 150.00,
  "volatility": 0.5,
  "type": "Finance"
}
```

## High Volatility Stock (Risky)

```json
{
  "name": "Risky Stock",
  "value": 50.00,
  "volatility": 3,
  "type": "Technology"
}
```

## Popular Tech Stock

```json
{
  "name": "Microsoft",
  "value": 290.00,
  "volatility": 1,
  "type": "Technology"
}
```

## Energy Stock

```json
{
  "name": "BP Energy",
  "value": 45.00,
  "volatility": 2,
  "type": "Energy"
}
```

## Finance Stock

```json
{
  "name": "Goldman Sachs",
  "value": 310.00,
  "volatility": 1.5,
  "type": "Finance"
}
```

## Raw Materials Stock

```json
{
  "name": "Rio Tinto",
  "value": 78.00,
  "volatility": 2,
  "type": "Raw Materials"
}
```

## Adding Multiple Stocks at Once

To add multiple stocks, simply add them to the array in `stocks.json`:

```json
[
  {
    "name": "Existing Stock",
    "value": 100.00,
    "volatility": 1,
    "type": "Technology"
  },
  {
    "name": "New Stock 1",
    "value": 150.00,
    "volatility": 1,
    "type": "Technology"
  },
  {
    "name": "New Stock 2",
    "value": 200.00,
    "volatility": 2,
    "type": "Finance"
  }
]
```

## Common Stock Types to Use

- `Technology` - Tech companies (Apple, Google, Microsoft)
- `Finance` - Banks and financial services
- `Energy` - Oil, gas, renewable energy
- `Raw Materials` - Mining, metals, agriculture
- `Fire Arms` - Defense/weapons industry
- Or create your own category name

## Price Recommendations by Category

| Category | Typical Range | Example |
|----------|---------------|---------|
| Technology | $20 - $2000 | Apple ($185), Samsung ($2,210) |
| Finance | $80 - $2000 | Credit Suisse ($178), MasterCard ($2,001) |
| Energy | $20 - $350 | SolarCity ($20), Wind Power ($333) |
| Raw Materials | $30 - $900 | Glencore ($30), Holcim ($898) |
| Fire Arms | $40 - $420 | TroubleShooters ($40), Ruag ($413) |

## Volatility Scale

- **0.1 - 0.5**: Ultra-stable utilities and large-cap stocks
- **1.0**: Average tech and finance stocks
- **1.5 - 2.0**: Higher risk stocks
- **2.5 - 3.0**: Very volatile/speculative stocks
