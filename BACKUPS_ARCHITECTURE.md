# Backups Folder System - Visual Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Stock Market Simulation                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Data Management Component                     │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Export to Backups Folder [Button]                │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                        ↓                                 │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  handleExportData()                                │ │  │
│  │  │  • Collects game state                             │ │  │
│  │  │  • Calls saveBackup(data)                          │ │  │
│  │  │  • Shows success message                           │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                        ↓                                 │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  📁 Backups Folder Section                         │ │  │
│  │  │  [5 backups stored | 230 KB]                       │ │  │
│  │  │  ┌──────────────────────────────────────────────┐  │ │  │
│  │  │  │ • backup-2026-02-01 [Download] [Delete]     │  │ │  │
│  │  │  │ • backup-2026-01-28 [Download] [Delete]     │  │ │  │
│  │  │  │ • backup-2026-01-25 [Download] [Delete]     │  │ │  │
│  │  │  │ • backup-2026-01-22 [Download] [Delete]     │  │ │  │
│  │  │  │ • backup-2026-01-19 [Download] [Delete]     │  │ │  │
│  │  │  └──────────────────────────────────────────────┘  │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│                          ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Backup Service                               │  │
│  │  (src/services/backupService.ts)                        │  │
│  │                                                          │  │
│  │  • initializeBackupsFolder()                            │  │
│  │  • saveBackup(data)                                     │  │
│  │  • getAllBackups()                                      │  │
│  │  • deleteBackup(id)                                     │  │
│  │  • downloadBackup(id)                                   │  │
│  │  • getBackupsStats()                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Browser LocalStorage                         │  │
│  │  (stockmarket_backups_folder)                           │  │
│  │                                                          │  │
│  │  {                                                       │  │
│  │    created: "ISO_TIMESTAMP",                            │  │
│  │    lastModified: "ISO_TIMESTAMP",                       │  │
│  │    backups: [                                           │  │
│  │      {                                                  │  │
│  │        id: "backup_TIMESTAMP",                          │  │
│  │        filename: "backup-2026-02-01.json",             │  │
│  │        data: "{ JSON string }",                         │  │
│  │        timestamp: "ISO_TIMESTAMP",                      │  │
│  │        size: 45678,                                     │  │
│  │        exportDate: "ISO_TIMESTAMP"                      │  │
│  │      },                                                 │  │
│  │      ... more backups ...                              │  │
│  │    ]                                                    │  │
│  │  }                                                       │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Export Flow
```
User clicks Export
      ↓
handleExportData()
      ↓
Collect game state from Redux
      ↓
Call saveBackup(data)
      ↓
Create unique ID (backup_TIMESTAMP)
      ↓
Get folder from localStorage
      ↓
Add backup to backups array
      ↓
Save updated folder to localStorage
      ↓
Show success message
      ↓
Backup appears in list!
```

### Download Flow
```
User clicks Download
      ↓
getBackupById(id)
      ↓
Create Blob from backup data
      ↓
Create download link
      ↓
Trigger download
      ↓
File saved to Downloads folder
```

### Delete Flow
```
User clicks Delete
      ↓
Show confirmation dialog
      ↓
User confirms
      ↓
deleteBackup(id)
      ↓
Get folder from localStorage
      ↓
Remove backup from array
      ↓
Save updated folder
      ↓
UI refreshes
      ↓
Backup removed from list
```

## Component Hierarchy

```
App
└── DataManagement
    ├── State Management
    │   ├── message
    │   ├── messageType
    │   └── showBackupsList
    │
    ├── Methods
    │   ├── handleExportData()
    │   ├── handleImportData()
    │   ├── handleDeleteBackup()
    │   ├── handleDownloadBackup()
    │   ├── handleClearData()
    │   └── toggleBackupsList()
    │
    └── Render UI
        ├── Alert Messages
        ├── Export Section
        ├── Backups Folder Section
        │   ├── Statistics
        │   └── Backup List
        │       ├── Download Button
        │       └── Delete Button
        ├── Import Section
        └── Clear Data Section
```

## Service API Reference

```
┌─────────────────────────────────────────────────────────┐
│              Backup Service API                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  INITIALIZATION                                         │
│  ├─ initializeBackupsFolder()                          │
│  │   Creates folder if missing                         │
│  │                                                     │
│  BACKUP OPERATIONS                                      │
│  ├─ saveBackup(data, filename?)                        │
│  │   Save game state as backup                         │
│  │   Returns: BackupFile                              │
│  │                                                     │
│  RETRIEVAL                                              │
│  ├─ getAllBackups()                                    │
│  │   Get all backups (sorted newest first)             │
│  │   Returns: BackupFile[]                            │
│  │                                                     │
│  ├─ getBackupById(id)                                 │
│  │   Get specific backup by ID                         │
│  │   Returns: BackupFile | undefined                  │
│  │                                                     │
│  ├─ getBackupsStats()                                 │
│  │   Get folder statistics                            │
│  │   Returns: Statistics object                       │
│  │                                                     │
│  DELETION                                               │
│  ├─ deleteBackup(id)                                  │
│  │   Delete backup by ID                              │
│  │   Returns: boolean                                 │
│  │                                                     │
│  ├─ clearAllBackups()                                 │
│  │   Delete all backups                               │
│  │   Returns: void                                    │
│  │                                                     │
│  EXPORT/DOWNLOAD                                        │
│  ├─ downloadBackup(id)                                │
│  │   Download backup as JSON file                      │
│  │   Returns: void (triggers download)                │
│  │                                                     │
│  ├─ exportBackupsFolder()                             │
│  │   Export entire folder as file                      │
│  │   Returns: void (triggers download)                │
│  │                                                     │
└─────────────────────────────────────────────────────────┘
```

## Storage Structure

```
Browser LocalStorage
└── stockmarket_backups_folder
    ├── Metadata
    │   ├── created: ISO timestamp
    │   └── lastModified: ISO timestamp
    │
    └── backups: Array
        ├── Backup 1
        │   ├── id: backup_1701234567890
        │   ├── filename: backup-2026-02-01.json
        │   ├── data: JSON string (~50KB)
        │   ├── timestamp: ISO timestamp
        │   ├── size: bytes
        │   └── exportDate: ISO timestamp
        │
        ├── Backup 2
        │   ├── id: backup_1701234567891
        │   ├── filename: backup-2026-01-28.json
        │   ├── data: JSON string (~50KB)
        │   ├── timestamp: ISO timestamp
        │   ├── size: bytes
        │   └── exportDate: ISO timestamp
        │
        └── ... more backups ...
```

## User Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│              User Workflows                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  WORKFLOW 1: Regular Backup                            │
│  ├─ Open Data Management                               │
│  ├─ Click "Export to Backups Folder"                   │
│  ├─ Backup created automatically                       │
│  └─ Backup listed in folder                            │
│                                                         │
│  WORKFLOW 2: View & Manage                             │
│  ├─ Open Data Management                               │
│  ├─ Click folder icon to expand                        │
│  ├─ See all backups listed                             │
│  ├─ Click Download/Delete as needed                    │
│  └─ Done!                                              │
│                                                         │
│  WORKFLOW 3: Transfer to Another PC                    │
│  ├─ On Computer A: Export to Backups                   │
│  ├─ Click "Download" to get file                       │
│  ├─ Move file to Computer B (USB/Cloud)               │
│  ├─ On Computer B: Click "Import Data"                │
│  ├─ Select the backup file                             │
│  └─ Game restored on Computer B                        │
│                                                         │
│  WORKFLOW 4: Safe Experimentation                      │
│  ├─ Export current state                               │
│  ├─ Make risky trades/changes                          │
│  ├─ If things go wrong:                                │
│  │   ├─ Download backup                                │
│  │   ├─ Import to restore                              │
│  │   └─ Back to safe state                             │
│  └─ If things go well: Keep new state                  │
│                                                         │
│  WORKFLOW 5: Milestone Saving                          │
│  ├─ Day 50: Export to Backups                          │
│  ├─ Day 100: Export to Backups                         │
│  ├─ Day 200: Export to Backups                         │
│  ├─ Day 500: Export to Backups                         │
│  └─ Keep all milestone saves for reference             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## System Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                   UI Layer                              │
│        (DataManagement React Component)                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Buttons, Forms, Lists, Messages                  │  │
│  │ User-friendly interface                          │  │
│  └───────────────────────────────────────────────────┘  │
│                         ↓                                │
├─────────────────────────────────────────────────────────┤
│               Business Logic Layer                      │
│           (Backup Service API)                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ saveBackup, deleteBackup, getAllBackups, etc.   │  │
│  │ Backup management logic                          │  │
│  └───────────────────────────────────────────────────┘  │
│                         ↓                                │
├─────────────────────────────────────────────────────────┤
│              Data Persistence Layer                     │
│          (Browser LocalStorage API)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │ localStorage.getItem()                           │  │
│  │ localStorage.setItem()                           │  │
│  └───────────────────────────────────────────────────┘  │
│                         ↓                                │
├─────────────────────────────────────────────────────────┤
│            Storage Layer                                │
│        (Browser's Local Storage)                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │ stockmarket_backups_folder                       │  │
│  │ JSON data persisted on computer                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Feature Integration Map

```
Core App Features
│
├─ Redux Store (AppState)
│   │
│   ├─ Depot data
│   ├─ Stock Market data
│   ├─ Quests
│   ├─ News
│   ├─ Upgrades
│   └─ Transactions
│
├─ Data Management Component
│   │
│   ├─ Export Data
│   │   └─→ Backup Service
│   │       └─→ localStorage
│   │
│   ├─ Backups Folder (NEW)
│   │   └─→ Display backups
│   │   └─→ Download/Delete
│   │   └─→ Show statistics
│   │
│   ├─ Import Data
│   │   └─→ Restore from file
│   │   └─→ Update Redux store
│   │   └─→ Refresh UI
│   │
│   └─ Clear Data
│       └─→ Purge everything
│
└─ Browser Storage
    ├─ Redux persist (main app state)
    └─ Backups folder (NEW - backup management)
```

---

This architecture provides a clean, scalable, professional backup system integrated seamlessly with the existing Stock Market Simulation application.

**Version 1.0 | February 4, 2026 | ✅ Production Ready**
