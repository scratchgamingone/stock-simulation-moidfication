import * as React from 'react';
import { connect } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';
import { Footer } from '../../components/Footer/Footer';
import { Header } from '../../components/Header/Header';
import { NotificationSystemFrame } from '../../components/NotificationSystem';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import appRoutes from '../../routes/routes';
import { AppState } from '../../state/AppState';
import { getStockValue } from '../../state/depot/depotSelector';
import { loadState } from '../../state/initialLoad/initialLoadActions';

interface AppProps {
    currentMoney: number;
    currentStockBalance: number;
    loadState: () => void;
}

class App extends React.Component<AppProps> {

    constructor(props: AppProps) {
        super(props);
        console.log('[APP] Constructor called');
    }

    componentWillMount() {
        console.log('[APP] componentWillMount - loading state');
        this.props.loadState();
    }

    testButtonClick = () => {
        console.log('[APP] TEST BUTTON CLICKED!');
        alert('Test button works!');
    }

    render() {
        console.log('[APP] Render called');
        return (

            <div className="wrapper">
                <button 
                    onClick={this.testButtonClick}
                    style={{
                        position: 'fixed',
                        top: '10px',
                        right: '10px',
                        zIndex: 99999,
                        padding: '10px 20px',
                        backgroundColor: 'red',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    TEST BUTTON
                </button>
                <NotificationSystemFrame/>
                <Sidebar
                    currentBalance={this.props.currentMoney}
                    currentStockBalance={this.props.currentStockBalance}
                />
                <div id="main-panel" className="main-panel">
                    <Header {...this.props} />
                    {/* @ts-ignore - React 17 type compatibility */}
                    <Switch>
                        {
                            appRoutes.map((prop, key) => {
                                if (prop.redirect) {
                                    // @ts-ignore
                                    return (<Redirect path={prop.path} to={prop.to!} key={key}/>);
                                }
                                // @ts-ignore
                                return (
                                    <Route path={prop.path} component={prop.component} key={key}/>
                                );
                            })
                        }
                    </Switch>
                    <Footer/>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state: AppState) => ({
    currentMoney: state.depot.accountValue,
    currentStockBalance: getStockValue(state)
});

// tslint:disable-next-line:no-any
const mapDispatchToProps = (dispatch: any) => ({
    loadState: () =>
        dispatch(loadState())
});

export default connect(mapStateToProps, mapDispatchToProps)(App);