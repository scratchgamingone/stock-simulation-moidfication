# Backups Folder System - Quick Start Guide

## ✨ What's New?

Your Stock Market Simulation now has a **professional backup system** that automatically manages all your game exports in a centralized "backups folder."

## 🚀 Get Started in 30 Seconds

### 1️⃣ Make Your First Backup
```
1. Go to: Data Management (Dashboard → Settings → Data Management)
2. Click: "Export to Backups Folder" button
3. Done! ✓ Backup created automatically
```

### 2️⃣ See All Your Backups  
```
1. In Data Management, click the folder icon 📁
2. See all your saved backups listed
3. View size, date, and time for each backup
```

### 3️⃣ Restore from a Backup
```
1. Click "Download" next to any backup
2. Save the file to your computer
3. Click "Import Data from File"
4. Select the backup file
5. Your game is restored! ✓
```

## 📋 Main Features

| Feature | What It Does |
|---------|------------|
| **Auto-Create Folder** | Backups folder initializes on first export |
| **Export to Folder** | Save game state to centralized backup location |
| **View Backups** | See all backups with timestamps and sizes |
| **Download Backup** | Export any backup as JSON file |
| **Delete Backup** | Remove old backups to save space |
| **Statistics** | See total backups and storage used |

## 🎯 Common Tasks

### Save Before Risky Trades
```
1. Export current game state
2. Make risky trades
3. If things go wrong:
   - Download the backup
   - Import to restore to safe point
```

### Transfer to Another Computer
```
1. Export game → Backups Folder
2. Download backup file
3. Copy to USB or cloud storage
4. On new computer: Import the file
```

### Keep Multiple Save Points
```
• Keep backups from different game stages
• Day 50 milestone backup
• Day 100 milestone backup
• Day 200 milestone backup
• Easy rollback to any point
```

## 📁 Where Are My Backups?

**Stored in:** Browser's local storage  
**Key:** `stockmarket_backups_folder`  
**Access:** Data Management → Backups Folder section

Backups are stored securely in your browser and survive:
- ✅ Browser closure
- ✅ Computer restarts
- ✅ Other apps running

Backups are cleared if you:
- ❌ Clear browser local storage
- ❌ Uninstall browser (sometimes)
- ❌ Use private/incognito mode

## 🔒 Important Reminders

⚠️ **Always download important backups** - Don't rely only on browser storage  
⚠️ **Test imports first** - Import creates backup before restoring  
⚠️ **Keep backups organized** - Delete old ones to save space  
⚠️ **Backup limit** - Browser usually allows ~5-10 MB total storage  

## 💾 Storage Tips

### Current Backup Size
- Typical game state: **20-100 KB**
- With 50 backups: **1-5 MB**

### When to Clean Up
```
You have: 5 backups → Safe, plenty of room ✓
You have: 10 backups → Getting full, clean up soon
You have: 20+ backups → Clean up now! Delete old ones
```

### How to Clean Up
```
1. Go to Backups Folder
2. Delete backups you don't need
3. Download important ones first (as backup)
```

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backups not appearing | Refresh page, check if localStorage enabled |
| File won't import | Verify file is valid JSON, not corrupted |
| "Export failed" error | Check browser console, delete old backups |
| Backups disappeared | Check if localStorage was cleared |

## 📖 For More Details

See [BACKUPS_GUIDE.md](BACKUPS_GUIDE.md) for comprehensive documentation including:
- Complete feature list
- Advanced use cases
- API reference
- Full troubleshooting guide
- Best practices

## ✅ Quick Checklist

- [ ] Created first backup
- [ ] Viewed backups list
- [ ] Downloaded a backup
- [ ] Tested import (with a copy of game state)
- [ ] Set backup routine (weekly, before major trades)
- [ ] Cleaned up old backups

## 🎓 Pro Tips

1. **Weekly Backup** - Export every Sunday evening
2. **Save Milestones** - Export on day 50, 100, 200, etc.
3. **Download Backups** - Keep copies on your computer
4. **Test Safely** - Always backup before trying new strategies
5. **Clean Regularly** - Delete old backups to keep storage clean

---

**Ready to start?** Go to Data Management and click "Export to Backups Folder" now!
