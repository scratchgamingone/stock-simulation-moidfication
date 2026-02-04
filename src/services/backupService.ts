/**
 * Backup Service
 * Handles automatic creation and management of the backups folder
 * Stores all export files in a centralized backups directory
 */

const BACKUPS_STORAGE_KEY = 'stockmarket_backups_folder';
const BACKUP_PREFIX = 'backup_';

interface BackupFile {
    id: string;
    filename: string;
    data: string;
    timestamp: string;
    size: number;
    exportDate: string;
}

interface BackupsFolder {
    created: string;
    lastModified: string;
    backups: BackupFile[];
}

/**
 * Initialize the backups folder in localStorage
 * Creates it if it doesn't exist
 */
export const initializeBackupsFolder = (): void => {
    const existingFolder = localStorage.getItem(BACKUPS_STORAGE_KEY);
    
    if (!existingFolder) {
        const backupsFolder: BackupsFolder = {
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            backups: []
        };
        localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(backupsFolder));
        console.log('✓ Backups folder initialized');
    }
};

/**
 * Get the backups folder object
 */
export const getBackupsFolder = (): BackupsFolder => {
    const folderData = localStorage.getItem(BACKUPS_STORAGE_KEY);
    
    if (!folderData) {
        initializeBackupsFolder();
        return getBackupsFolder(); // Recursive call after initialization
    }
    
    return JSON.parse(folderData);
};

/**
 * Save a backup file to the backups folder
 */
export const saveBackup = (data: any, filename?: string): BackupFile => {
    // Initialize if needed
    initializeBackupsFolder();
    
    const timestamp = new Date().toISOString();
    const dateString = timestamp.split('T')[0];
    const backupFilename = filename || `stockmarket-backup-${dateString}.json`;
    
    const dataStr = JSON.stringify(data, null, 2);
    
    const backup: BackupFile = {
        id: `${BACKUP_PREFIX}${Date.now()}`,
        filename: backupFilename,
        data: dataStr,
        timestamp: timestamp,
        size: dataStr.length,
        exportDate: data.exportDate || timestamp
    };
    
    const folder = getBackupsFolder();
    folder.backups.push(backup);
    folder.lastModified = new Date().toISOString();
    
    localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(folder));
    console.log(`✓ Backup saved: ${backupFilename} (ID: ${backup.id})`);
    
    return backup;
};

/**
 * Get all backups from the backups folder
 */
export const getAllBackups = (): BackupFile[] => {
    const folder = getBackupsFolder();
    return folder.backups.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
};

/**
 * Get a specific backup by ID
 */
export const getBackupById = (id: string): BackupFile | undefined => {
    const folder = getBackupsFolder();
    return folder.backups.find(backup => backup.id === id);
};

/**
 * Delete a backup from the backups folder
 */
export const deleteBackup = (id: string): boolean => {
    const folder = getBackupsFolder();
    const initialLength = folder.backups.length;
    
    folder.backups = folder.backups.filter(backup => backup.id !== id);
    folder.lastModified = new Date().toISOString();
    
    if (folder.backups.length < initialLength) {
        localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(folder));
        console.log(`✓ Backup deleted: ${id}`);
        return true;
    }
    
    return false;
};

/**
 * Clear all backups from the backups folder
 */
export const clearAllBackups = (): void => {
    initializeBackupsFolder();
    const folder: BackupsFolder = {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        backups: []
    };
    localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(folder));
    console.log('✓ All backups cleared');
};

/**
 * Export a backup as a downloadable file
 */
export const downloadBackup = (backupId: string): void => {
    const backup = getBackupById(backupId);
    
    if (!backup) {
        console.error(`Backup not found: ${backupId}`);
        return;
    }
    
    const dataBlob = new Blob([backup.data], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = backup.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`✓ Backup downloaded: ${backup.filename}`);
};

/**
 * Get statistics about the backups folder
 */
export const getBackupsStats = () => {
    const folder = getBackupsFolder();
    const totalSize = folder.backups.reduce((sum, b) => sum + b.size, 0);
    
    return {
        totalBackups: folder.backups.length,
        totalSize: totalSize,
        totalSizeKB: (totalSize / 1024).toFixed(2),
        oldestBackup: folder.backups.length > 0 ? folder.backups[folder.backups.length - 1].timestamp : null,
        newestBackup: folder.backups.length > 0 ? folder.backups[0].timestamp : null,
        folderCreated: folder.created,
        lastModified: folder.lastModified
    };
};

/**
 * Export entire backups folder as a file (for system backup)
 */
export const exportBackupsFolder = (): void => {
    const folder = getBackupsFolder();
    const dataStr = JSON.stringify(folder, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stockmarket-backups-folder-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`✓ Backups folder exported with ${folder.backups.length} backups`);
};
