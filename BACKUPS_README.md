# Backups Folder System - At a Glance

## 🎯 What It Does

Automatically manages all game exports in a centralized **"backups folder"** with:
- ✅ Auto-creation if folder doesn't exist
- ✅ Save multiple backup versions
- ✅ Easy list, download, and delete backups
- ✅ Storage statistics and management
- ✅ Cross-computer backup transfer

## 📍 Where to Access

**Location:** `Data Management` → `Backups Folder` section

## 🚀 Quick Start (3 Steps)

```
1. Go to Data Management
2. Click "Export to Backups Folder"
3. Backup created and listed automatically!
```

## 📋 Main Functions

| Function | How To | Result |
|----------|--------|--------|
| **Export** | Click "Export to Backups Folder" | Backup created + listed |
| **View** | Click folder icon | See all backups with dates/sizes |
| **Download** | Click "Download" next to backup | Save backup to file |
| **Delete** | Click "Delete" next to backup | Remove backup (can't undo) |
| **Import** | Click "Import Data from File" | Restore from downloaded backup |
| **Stats** | See "Backups Folder" section | View total backups & storage size |

## 🎓 Common Workflows

### Before Risky Trades
```
1. Export to Backups Folder
2. Make risky trades
3. If things fail:
   - Download backup from folder
   - Import to restore
```

### Transfer to New Computer
```
1. Export to Backups Folder
2. Download backup from folder
3. Move file to new computer
4. Import the backup file there
5. Game continues on new computer
```

### Regular Maintenance
```
Every Week:
1. Export to Backups Folder
2. Backups automatically listed
3. Delete old backups if too many
4. Peace of mind! 😊
```

## 💾 Storage

**Where:** Browser's localStorage  
**Typical Size:** 20-100 KB per backup  
**Limit:** ~5-10 MB per browser  
**Survives:** Browser close, computer restart  
**Cleared By:** Clearing localStorage, privacy mode

## 📊 Backup Info Shown

For each backup you see:
- Filename (e.g., `stockmarket-backup-2026-02-01.json`)
- Creation date & time
- File size (in KB)
- Download button
- Delete button

## ⚠️ Important

- 🔒 Stored locally in browser (not on server)
- 📥 Download important backups to your computer
- 🗑️ Deletion is permanent (no recovery)
- 📦 Keep 5-10 backups; delete old ones to save space
- 🌐 Works offline after page loads

## 📚 Full Documentation

- **Quick Reference:** [BACKUPS_QUICK_START.md](BACKUPS_QUICK_START.md)
- **Complete Guide:** [BACKUPS_GUIDE.md](BACKUPS_GUIDE.md)
- **Implementation Details:** [BACKUPS_IMPLEMENTATION.md](BACKUPS_IMPLEMENTATION.md)

## 🆘 Quick Fixes

| Problem | Fix |
|---------|-----|
| Backups not showing | Refresh page |
| Export fails | Delete old backups to free space |
| Import won't work | Verify file is valid JSON |
| Backups disappeared | Check if localStorage was cleared |

## ✨ Features

✅ Automatic folder creation  
✅ Multiple backup versions  
✅ Easy view/download/delete  
✅ Storage statistics  
✅ Cross-device transfer  
✅ No setup required  
✅ Works offline  
✅ Zero configuration  

---

**Status:** ✅ Ready to Use  
**Latest Update:** February 2026
