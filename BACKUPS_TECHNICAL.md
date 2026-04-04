# Backups Folder System - Developer Reference

## 🏗️ Architecture

### Service Layer
**File:** `src/services/backupService.ts`

Provides complete backup management without touching UI or Redux.

### UI Layer  
**File:** `src/views/DataManagement/DataManagement.tsx`

React component integrates backup service and displays UI.

### Storage Layer
**Location:** Browser localStorage  
**Key:** `stockmarket_backups_folder`

## 🔧 Core API Reference

### `initializeBackupsFolder(): void`
Initialize backups folder if it doesn't exist.
```typescript
// Called automatically by component
initializeBackupsFolder();

// Creates structure if missing:
// {
//   created: "ISO_TIMESTAMP",
//   lastModified: "ISO_TIMESTAMP",
//   backups: []
// }
```

### `saveBackup(data: any, filename?: string): BackupFile`
Save game state as a new backup.
```typescript
const backup = saveBackup(gameState);
// Returns: BackupFile with id, filename, data, timestamp, size

const customBackup = saveBackup(gameState, "my-backup.json");
// Uses custom filename
```

### `getAllBackups(): BackupFile[]`
Get all backups sorted by newest first.
```typescript
const allBackups = getAllBackups();
// Returns: BackupFile[] sorted by timestamp descending
```

### `getBackupById(id: string): BackupFile | undefined`
Get specific backup by ID.
```typescript
const backup = getBackupById("backup_1701234567890");
// Returns: BackupFile or undefined if not found
```

### `deleteBackup(id: string): boolean`
Delete a backup by ID.
```typescript
const success = deleteBackup("backup_1701234567890");
// Returns: true if deleted, false if not found
```

### `clearAllBackups(): void`
Remove all backups and reset folder.
```typescript
clearAllBackups();
// Clears all backups, folder remains initialized
```

### `downloadBackup(backupId: string): void`
Trigger download of backup as JSON file.
```typescript
downloadBackup("backup_1701234567890");
// Browser downloads: stockmarket-backup-2026-02-01.json
```

### `exportBackupsFolder(): void`
Export entire backups folder as single file.
```typescript
exportBackupsFolder();
// Browser downloads: stockmarket-backups-folder-2026-02-01.json
// Contains all backups in folder structure
```

### `getBackupsStats(): Object`
Get statistics about backups folder.
```typescript
const stats = getBackupsStats();
// Returns: {
//   totalBackups: 5,
//   totalSize: 234567,
//   totalSizeKB: "228.87",
//   oldestBackup: "2026-01-15T...",
//   newestBackup: "2026-02-01T...",
//   folderCreated: "2026-01-01T...",
//   lastModified: "2026-02-01T..."
// }
```

## 📊 Data Structures

### BackupFile Interface
```typescript
interface BackupFile {
    id: string;              // Unique ID: backup_TIMESTAMP
    filename: string;        // Original filename
    data: string;           // Stringified JSON
    timestamp: string;      // ISO creation timestamp
    size: number;           // Size in bytes
    exportDate: string;     // Original export date
}
```

### BackupsFolder Interface
```typescript
interface BackupsFolder {
    created: string;        // ISO timestamp of folder creation
    lastModified: string;   // ISO timestamp of last change
    backups: BackupFile[];  // Array of BackupFile objects
}
```

## 🔄 Data Flow

### Export Flow
```
User clicks "Export to Backups Folder"
    ↓
handleExportData() collects game state
    ↓
saveBackup() stores to localStorage
    ↓
Backup appears in list
    ↓
User sees success message with file size
```

### Import Flow
```
User clicks "Import Data from File"
    ↓
handleImportData() reads selected file
    ↓
Parses JSON and updates localStorage
    ↓
Page auto-refreshes
    ↓
Game state restored
```

### Delete Flow
```
User clicks "Delete" button
    ↓
Confirmation dialog
    ↓
deleteBackup() removes from folder
    ↓
UI updates
    ↓
User sees success message
```

## 🧪 Integration Points

### Redux Integration
```typescript
// Backup service accesses full state
const dataToExport = {
    ...this.props.appState,  // Complete Redux state
    exportDate: new Date().toISOString(),
    version: '1.0'
};
```

### React Integration
```typescript
// Component lifecycle
constructor() → initializeBackupsFolder()
render() → getAllBackups() → display list
handleClick → deleteBackup() / downloadBackup()
```

### LocalStorage Integration
```typescript
const BACKUPS_STORAGE_KEY = 'stockmarket_backups_folder';
localStorage.getItem(BACKUPS_STORAGE_KEY)
localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(folder))
```

## 💾 Storage Format

### Stored in Browser
```json
{
  "stockmarket_backups_folder": {
    "created": "2026-02-01T10:30:00.000Z",
    "lastModified": "2026-02-01T15:45:30.000Z",
    "backups": [
      {
        "id": "backup_1701234567890",
        "filename": "stockmarket-backup-2026-02-01.json",
        "data": "{...full JSON...}",
        "timestamp": "2026-02-01T10:30:00.000Z",
        "size": 45678,
        "exportDate": "2026-02-01T10:30:00.000Z"
      }
    ]
  }
}
```

### Downloaded Backup File
```json
{
  "depot": {...},
  "stockMarket": {...},
  "quests": {...},
  "news": {...},
  "upgrades": {...},
  "transactions": {...},
  "exportDate": "2026-02-01T10:30:00.000Z",
  "version": "1.0"
}
```

## 🔍 Implementation Details

### Auto-Initialization
- Called in `DataManagement` constructor
- Checks if folder exists
- Creates if missing
- Safe to call multiple times

### Sorting Strategy
- Backups sorted by timestamp descending
- Newest backups appear first
- Maintained during all operations

### ID Generation
- Format: `backup_TIMESTAMP`
- Timestamp: `Date.now()`
- Guarantees uniqueness

### File Size Tracking
- JSON string length in bytes
- Calculated before storage
- Displayed as KB to user

## 🎨 UI Components

### Backups List Section
```tsx
<div style={{ marginBottom: '30px' }}>
    <h5>Backups Folder 
        <i className="pe-7s-folder" onClick={this.toggleBackupsList}></i>
    </h5>
    
    {showBackupsList && (
        <div>
            {/* Backup list items */}
            {allBackups.map(backup => (
                <div key={backup.id}>
                    {/* Backup details */}
                    <Button onClick={() => this.handleDownloadBackup(backup.id)}>
                        Download
                    </Button>
                    <Button onClick={() => this.handleDeleteBackup(backup.id)}>
                        Delete
                    </Button>
                </div>
            ))}
        </div>
    )}
</div>
```

### Statistics Display
```tsx
<div>
    <p>
        <strong>{backupsStats.totalBackups}</strong> backup(s) saved • 
        <strong>{backupsStats.totalSizeKB}</strong> KB total
    </p>
</div>
```

## 🚀 Performance Considerations

### Time Complexity
- Save backup: O(n) where n = existing backups
- Get all: O(n log n) due to sorting
- Get one: O(n)
- Delete: O(n)
- Clear: O(1)

### Space Complexity
- Storage grows linearly with backups
- Each backup stored as string in JSON
- No compression (future optimization)

### Browser Limits
- localStorage: ~5-10 MB per domain
- With ~20-100 KB per backup
- Supports 50-500 backups typically

## 🔐 Security Considerations

### Data Privacy
- Stored locally in browser only
- No server transmission
- No external API calls
- Works offline

### Data Safety
- localStorage persists across sessions
- Survives browser restarts
- Not cleared by cache clear
- Cleared by explicit localStorage clear

### Error Handling
- Try-catch blocks protect operations
- Invalid JSON handled gracefully
- Missing folder recreated automatically
- Delete failures caught

## 🧩 Extension Points

Possible future enhancements:
```typescript
// Auto-cleanup old backups
export const autoCleanupOldBackups(days: number): void

// Backup compression
export const compressBackup(backup: BackupFile): BackupFile

// Scheduled backups  
export const scheduleAutoBackup(intervalMinutes: number): void

// Backup encryption
export const encryptBackup(backup: BackupFile): BackupFile

// Cloud sync
export const syncToCloud(backup: BackupFile): Promise<void>

// Backup tagging
export const tagBackup(id: string, tags: string[]): void

// Backup search
export const searchBackups(query: string): BackupFile[]
```

## 📦 Dependencies

- None! Service has no external dependencies
- Uses native JavaScript and browser APIs
- No npm packages required
- Lightweight and self-contained

## ✅ Testing Checklist

- [ ] Folder initializes on first export
- [ ] Multiple backups can be created
- [ ] Backups appear in list view
- [ ] Download creates valid JSON file
- [ ] Delete removes backup from list
- [ ] Stats update correctly
- [ ] Import from file works
- [ ] No localStorage errors
- [ ] Works in all modern browsers
- [ ] Performance is acceptable

---

**Technical Version:** 1.0  
**Last Updated:** February 2026  
**Status:** ✅ Production Ready
