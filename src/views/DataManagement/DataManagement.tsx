import * as React from 'react';
import { connect } from 'react-redux';
import { Card, Button, Alert } from 'react-bootstrap';
import { AppState } from '../../state/AppState';

interface DataManagementProps {
    appState: AppState;
}

interface DataManagementState {
    message: string;
    messageType: 'success' | 'danger' | 'info' | '';
}

class DataManagement extends React.Component<DataManagementProps, DataManagementState> {
    
    constructor(props: DataManagementProps) {
        super(props);
        this.state = {
            message: '',
            messageType: ''
        };
    }

    handleExportData = () => {
        try {
            const dataToExport = {
                ...this.props.appState,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `stockmarket-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.setState({
                message: 'Data exported successfully! Check your downloads folder.',
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

    handleClearData = () => {
        if (window.confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
            localStorage.clear();
            this.setState({
                message: 'All data cleared! Page will refresh in 2 seconds.',
                messageType: 'info'
            });
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    };

    render() {
        const { message, messageType } = this.state;

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
                                            Save all your simulation data (stocks, transactions, quests, account balance) to a file on your computer.
                                        </p>
                                        <Button variant="primary" onClick={this.handleExportData}>
                                            <i className="pe-7s-download" style={{ marginRight: '5px' }}></i>
                                            Export All Data
                                        </Button>
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
                                            Export to file if you want a backup or to transfer data to another computer/browser.
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
