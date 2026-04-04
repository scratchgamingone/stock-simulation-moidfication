import * as React from 'react';
import { connect } from 'react-redux';
import { Card, Button, Alert } from 'react-bootstrap';
import { AppState } from '../../state/AppState';
import { persistor } from '../../index';
import { 
    initializeBackupsFolder, 
    saveBackup, 
    getAllBackups, 
    deleteBackup, 
    downloadBackup,
    getBackupsStats
} from '../../services/backupService';

interface DataManagementProps {
    appState: AppState;
}

interface DataManagementState {
    message: string;
    messageType: 'success' | 'danger' | 'info' | '';
    showBackupsList: boolean;
}

class DataManagement extends React.Component<DataManagementProps, DataManagementState> {
    
    constructor(props: DataManagementProps) {
        super(props);
        this.state = {
            message: '',
            messageType: '',
            showBackupsList: false
        };
        // Initialize backups folder on component mount
        initializeBackupsFolder();
    }

    handleExportData = () => {
        try {
            const dataToExport = {
                ...this.props.appState,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            // Save to backups folder
            const backup = saveBackup(dataToExport);

            this.setState({
                message: `Data exported successfully to backups folder! (${(backup.size / 1024).toFixed(2)} KB)`,
                messageType: 'success'
            });
        } catch (error) {
            this.setState({
                message: 'Failed to export data: ' + error,
                messageType: 'danger'
            });
        }
    };

    handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target?.result as string);
                
                // Store in localStorage to be picked up by redux-persist
                localStorage.setItem('persist:root', JSON.stringify({
                    depot: JSON.stringify(importedData.depot),
                    stockMarket: JSON.stringify(importedData.stockMarket),
                    quests: JSON.stringify(importedData.quests),
                    news: JSON.stringify(importedData.news),
                    upgrades: JSON.stringify(importedData.upgrades),
                    transactions: JSON.stringify(importedData.transactions),
                    _persist: JSON.stringify({ version: -1, rehydrated: true })
                }));

                this.setState({
                    message: 'Data imported successfully! Please refresh the page to load the imported data.',
                    messageType: 'success'
                });

                // Auto-refresh after 2 seconds
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } catch (error) {
                this.setState({
                    message: 'Failed to import data: ' + error,
                    messageType: 'danger'
                });
            }
        };
        reader.readAsText(file);
    };

    handleClearData = async () => {
        if (window.confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
            try {
                // Clear redux-persist storage
                if (persistor) {
                    await persistor.purge();
                }
                
                // Clear all localStorage
                localStorage.clear();
                
                // Clear sessionStorage as well
                sessionStorage.clear();
                
                this.setState({
                    message: 'All data cleared! Page will refresh in 2 seconds.',
                    messageType: 'info'
                });
                
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } catch (error) {
                this.setState({
                    message: 'Failed to clear data: ' + error,
                    messageType: 'danger'
                });
            }
        }
    };

    handleDeleteBackup = (backupId: string) => {
        if (window.confirm('Are you sure you want to delete this backup?')) {
            deleteBackup(backupId);
            this.setState({
                message: 'Backup deleted successfully!',
                messageType: 'success'
            });
            // Refresh the backups list by toggling state
            this.forceUpdate();
        }
    };

    handleDownloadBackup = (backupId: string) => {
        try {
            downloadBackup(backupId);
            this.setState({
                message: 'Backup downloaded successfully!',
                messageType: 'success'
            });
        } catch (error) {
            this.setState({
                message: 'Failed to download backup: ' + error,
                messageType: 'danger'
            });
        }
    };

    toggleBackupsList = () => {
        this.setState({ showBackupsList: !this.state.showBackupsList });
    };

    render() {
        const { message, messageType, showBackupsList } = this.state;
        const allBackups = getAllBackups();
        const backupsStats = getBackupsStats();

        return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-8 offset-md-2">
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">
                                        <i className="pe-7s-diskette" style={{ marginRight: '10px' }}></i>
                                        Data Management
                                    </Card.Title>
                                    <p className="card-category">
                                        Export, import, or clear your simulation data
                                    </p>
                                </Card.Header>
                                <Card.Body>
                                    {message && (
                                        <Alert variant={messageType} dismissible onClose={() => this.setState({ message: '', messageType: '' })}>
                                            {message}
                                        </Alert>
                                    )}

                                    <div style={{ marginBottom: '30px' }}>
                                        <h5>Export Data</h5>
                                        <p style={{ color: '#666', marginBottom: '15px' }}>
                                            Save all your simulation data (stocks, transactions, quests, account balance) to the backups folder.
                                        </p>
                                        <Button variant="primary" onClick={this.handleExportData}>
                                            <i className="pe-7s-download" style={{ marginRight: '5px' }}></i>
                                            Export to Backups Folder
                                        </Button>
                                    </div>

                                    <hr />

                                    <div style={{ marginBottom: '30px' }}>
                                        <h5>Backups Folder 
                                            <i 
                                                className="pe-7s-folder" 
                                                style={{ marginLeft: '8px', cursor: 'pointer' }}
                                                onClick={this.toggleBackupsList}
                                                title="Click to toggle backups list"
                                            ></i>
                                        </h5>
                                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                                            <p><strong>{backupsStats.totalBackups}</strong> backup(s) saved • <strong>{backupsStats.totalSizeKB}</strong> KB total</p>
                                        </div>

                                        {showBackupsList && (
                                            <div style={{ 
                                                backgroundColor: '#f9f9f9', 
                                                border: '1px solid #ddd', 
                                                borderRadius: '4px', 
                                                padding: '15px',
                                                marginBottom: '15px'
                                            }}>
                                                {allBackups.length > 0 ? (
                                                    <div>
                                                        {allBackups.map((backup, index) => (
                                                            <div 
                                                                key={backup.id} 
                                                                style={{
                                                                    padding: '10px',
                                                                    borderBottom: index < allBackups.length - 1 ? '1px solid #eee' : 'none',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center'
                                                                }}
                                                            >
                                                                <div>
                                                                    <strong>{backup.filename}</strong>
                                                                    <br />
                                                                    <small style={{ color: '#999' }}>
                                                                        {new Date(backup.timestamp).toLocaleString()} • {(backup.size / 1024).toFixed(2)} KB
                                                                    </small>
                                                                </div>
                                                                <div>
                                                                    <Button
                                                                        variant="sm"
                                                                        style={{ marginRight: '5px' }}
                                                                        onClick={() => this.handleDownloadBackup(backup.id)}
                                                                        title="Download this backup"
                                                                    >
                                                                        <i className="pe-7s-download"></i> Download
                                                                    </Button>
                                                                    <Button
                                                                        variant="danger"
                                                                        size="sm"
                                                                        onClick={() => this.handleDeleteBackup(backup.id)}
                                                                        title="Delete this backup"
                                                                    >
                                                                        <i className="pe-7s-trash"></i> Delete
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p style={{ margin: 0, color: '#999' }}>No backups yet. Create one by exporting your data.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <hr />

                                    <div style={{ marginBottom: '30px' }}>
                                        <h5>Import Data</h5>
                                        <p style={{ color: '#666', marginBottom: '15px' }}>
                                            Load previously exported simulation data from a file. This will replace all current data.
                                        </p>
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={this.handleImportData}
                                            style={{ display: 'none' }}
                                            id="import-file-input"
                                        />
                                        <Button 
                                            variant="success" 
                                            onClick={() => document.getElementById('import-file-input')?.click()}
                                        >
                                            <i className="pe-7s-upload" style={{ marginRight: '5px' }}></i>
                                            Import Data from File
                                        </Button>
                                    </div>

                                    <hr />

                                    <div>
                                        <h5>Clear All Data</h5>
                                        <p style={{ color: '#666', marginBottom: '15px' }}>
                                            Reset the simulation and delete all data. This action cannot be undone!
                                        </p>
                                        <Button variant="danger" onClick={this.handleClearData}>
                                            <i className="pe-7s-trash" style={{ marginRight: '5px' }}></i>
                                            Clear All Data
                                        </Button>
                                    </div>

                                    <hr />

                                    <div style={{ backgroundColor: '#f4f4f4', padding: '15px', borderRadius: '4px', marginTop: '20px' }}>
                                        <h6 style={{ marginBottom: '10px' }}>
                                            <i className="pe-7s-info" style={{ marginRight: '5px' }}></i>
                                            Auto-Save Information
                                        </h6>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                                            Your data is automatically saved to your browser's local storage every time you make a change. 
                                            The data persists even if you close the browser or restart your computer.
                                            All backups are stored in the backups folder for easy management and recovery.
                                        </p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state: AppState) => ({
    appState: state
});

export default connect(mapStateToProps)(DataManagement);
