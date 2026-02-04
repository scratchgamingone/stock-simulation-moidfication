# Backups Folder System - Documentation

## Overview

The Stock Market Simulation now features an automatic **Backups Folder System** that manages all your exported game data in a centralized, organized location.

## 🎯 Key Features

✅ **Auto-Created Backups Folder** - Automatically initializes on first use
✅ **Centralized Storage** - All exports saved in one organized location  
✅ **Multiple Backups** - Store and manage multiple backup versions
✅ **Easy Recovery** - Quick download and restore from any saved backup
✅ **Storage Statistics** - View total backups, file sizes, and timestamps
✅ **Simple Management** - Delete, download, or list all backups with one click

## 📁 Backups Folder Structure

All backups are stored in browser's `localStorage` under the key: `stockmarket_backups_folder`

```
Backups Folder
├── created: 2026-02-01T10:30:00.000Z
├── lastModified: 2026-02-01T15:45:30.000Z
└── backups: [
    {
      id: "backup_1701234567890",
      filename: "stockmarket-backup-2026-02-01.json",
      data: "{ ... JSON data ... }",
      timestamp: "2026-02-01T10:30:00.000Z",
      size: 45678,
      exportDate: "2026-02-01T10:30:00.000Z"
    },
    ...
  ]
```

## 🚀 How to Use

### 1. Export Data to Backups Folder

**Location:** Data Management Page → "Export to Backups Folder"

```
1. Click "Export to Backups Folder" button
2. Your current game state is saved automatically
3. Success message displays backup details
4. Backup appears in the Backups Folder list
```

**What gets backed up:**
- Depot (portfolio, stocks owned)
- Stock Market data
- Quests progress
- News feed
- Upgrades purchased
- Transactions history
- Current account balance
- Export timestamp and version

### 2. View All Backups

**Location:** Data Management Page → "Backups Folder" section

```
1. Click the folder icon to expand the backups list
2. See all saved backups with:
   - Filename and creation date
   - File size in KB
   - Timestamp
3. Backups are sorted newest first
```

### 3. Download a Backup

**Reason:** Transfer backups to another computer or save to your file system

```
1. Click "Download" button next to any backup
2. Browser downloads the backup JSON file
3. File is saved to your Downloads folder
4. File can be imported back into the game anytime
```

### 4. Import a Backup File

**Location:** Data Management Page → "Import Data from File"

```
1. Click "Import Data from File" button
2. Select a .json backup file from your computer
3. Current game state will be REPLACED
4. Page auto-refreshes to load imported data
⚠️  WARNING: This action cannot be undone!
```

### 5. Delete a Backup

**Location:** Backups Folder section → Delete button

```
1. Click "Delete" button next to any backup
2. Confirm deletion when prompted
3. Backup is permanently removed from folder
⚠️  WARNING: Deleted backups cannot be recovered!
```

### 6. View Backup Statistics

**Location:** Data Management Page → Backups Folder section

Displays:
- Total number of backups stored
- Combined size of all backups (in KB)
- Oldest and newest backup dates
- Folder creation date
- Last modification date

## 💡 Common Use Cases

### Use Case 1: Regular Backup Routine
```
• Export data weekly → Backups Folder accumulates
• Keep 4-5 most recent backups
• Delete older backups to manage storage
• Peace of mind knowing data is safe
```

### Use Case 2: Transfer Between Computers
```
1. On Computer A: Export data → Backups Folder
2. Click "Download" to get JSON file
3. Move file to Computer B (USB, email, cloud)
4. On Computer B: Import the JSON file
5. Game state is now on Computer B
```

### Use Case 3: Experiment Safely
```
1. Export current game state (create backup)
2. Play risky strategies or make big changes
3. If it goes wrong, Download the backup
4. Import the backup to restore previous state
```

### Use Case 4: Test New Features
```
1. Export before trying new game features
2. If there are issues, revert by importing backup
3. Experimentation without fear
```

## 📊 Storage Information

### Browser Local Storage Limits
- **Chrome/Firefox/Safari:** ~5-10 MB per domain
- **Edge:** ~10 MB per domain
- **Storage varies:** Depends on browser settings

### File Size Estimation
- **Typical game state:** 20-100 KB per backup
- **With 50 backups:** 1-5 MB storage used
- **Storage recommendation:** Keep 5-10 recent backups

### Auto-Cleanup Recommendations
When approaching storage limits:
1. Download important backups first
2. Delete older backups not needed
3. Or clear all old backups and start fresh

## 🔧 Technical Details

### Backup Service API

Located at: `src/services/backupService.ts`

```typescript
// Initialize the backups folder
initializeBackupsFolder(): void

// Save current game state as backup
saveBackup(data: any, filename?: string): BackupFile

// Get all saved backups
getAllBackups(): BackupFile[]

// Get specific backup by ID
getBackupById(id: string): BackupFile | undefined

// Delete a backup
deleteBackup(id: string): boolean

// Clear all backups
clearAllBackups(): void

// Download backup as file
downloadBackup(backupId: string): void

// Export entire backups folder
exportBackupsFolder(): void

// Get statistics
getBackupsStats(): BackupsStats
```

### Integration Points

The backup system integrates with:
- **Data Management View** - UI for backups folder
- **Redux Store** - Accesses complete app state
- **Browser Storage** - Persists backups in localStorage
- **File API** - Handles downloads and imports

## ⚠️ Important Notes

### Data Safety
- ✅ Backups survive browser cache clears (stored in localStorage)
- ✅ Auto-backups on export (no manual creation needed)
- ⚠️ Clearing localStorage will delete ALL backups
- ⚠️ Browser history clearing does NOT affect backups

### Performance
- ✅ Minimal impact on app performance
- ✅ Backups stored efficiently in browser
- ✅ No server/internet required
- ✅ Instant backup creation and restoration

### Browser Compatibility
- ✅ All modern browsers supported
- ✅ Chrome, Firefox, Safari, Edge
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Works offline after initial load

## 🔄 Workflow Example

```
Step 1: Play the game
└─ Game auto-saves to localStorage continuously

Step 2: Reach a milestone (day 100)
└─ Go to Data Management
└─ Click "Export to Backups Folder"
└─ Backup created successfully

Step 3: Continue playing (take risks)
└─ Try aggressive trades
└─ Might lose money or fail quests

Step 4: Realized the risks were too high
└─ Go back to Data Management
└─ Expand "Backups Folder"
└─ Click "Import Data from File"
└─ Select day 100 backup
└─ Game restored to day 100 state

Step 5: Try safer approach
└─ Continue from backed-up state
└─ Make better decisions this time
```

## 📝 File Format

### Backup JSON Structure
```json
{
  "depot": { ... },
  "stockMarket": { ... },
  "quests": { ... },
  "news": { ... },
  "upgrades": { ... },
  "transactions": { ... },
  "exportDate": "2026-02-01T10:30:00.000Z",
  "version": "1.0"
}
```

### Folder Metadata Structure
```json
{
  "created": "2026-02-01T10:30:00.000Z",
  "lastModified": "2026-02-01T15:45:30.000Z",
  "backups": [
    {
      "id": "backup_1701234567890",
      "filename": "stockmarket-backup-2026-02-01.json",
      "data": "{ JSON string }",
      "timestamp": "2026-02-01T10:30:00.000Z",
      "size": 45678,
      "exportDate": "2026-02-01T10:30:00.000Z"
    }
  ]
}
```

## 🐛 Troubleshooting

### Problem: Backups folder not appearing
**Solution:** 
- Refresh the page
- Clear browser cache and reload
- Check if localStorage is enabled in browser settings

### Problem: "Failed to export data" error
**Solution:**
- Check browser console for errors
- Verify localStorage space available
- Try deleting old backups to free space

### Problem: Can't import a backup file
**Solution:**
- Verify file is in JSON format
- Check file wasn't corrupted
- Try exporting new backup to verify format

### Problem: Backups disappeared after clearing cache
**Solution:**
- Note: These are stored in localStorage, not cache
- Check if localStorage was disabled/cleared
- Backups can be re-created by exporting

### Problem: File size too large
**Solution:**
- Export game state manually
- Delete unnecessary backups
- Consider clearing old transaction records

## 🎓 Best Practices

1. **Regular Exports**
   - Export after major achievements
   - Export before risky trades
   - Weekly backup routine

2. **Backup Management**
   - Keep last 5-10 backups only
   - Delete duplicates and old backups
   - Download important backups as files

3. **Safe Testing**
   - Always export before experiments
   - Test changes, then restore if needed
   - Use backups to explore strategies

4. **Cross-Device Transfer**
   - Export and download backup
   - Share via cloud storage or USB
   - Import on another device/browser

5. **Disaster Recovery**
   - Keep a cloud backup of important backups
   - Download critical game milestones
   - Store backups in multiple locations

## 📞 Support

For issues or questions about the Backups Folder System:
1. Check this documentation
2. Review the troubleshooting section
3. Open an issue on GitHub
4. Check browser console logs for errors

---

**Last Updated:** February 2026  
**Version:** 1.0  
**Feature Status:** ✅ Stable & Production Ready
