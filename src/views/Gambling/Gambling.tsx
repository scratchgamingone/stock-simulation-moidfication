// @ts-nocheck
import * as React from 'react';
import { connect } from 'react-redux';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { AppState } from '../../state/AppState';
import { changeAccountValue } from '../../state/depot/depotActions';
import { PriceTag } from '../../components/PriceTag';

interface GamblingProps {
    accountValue: number;
    changeAccountValue: (delta: number) => void;
}

interface GamblingState {
    customAmount: string;
    lastMessage?: string;
    lastWin?: boolean;
    lastAmount?: number;
}

class Gambling extends React.Component<GamblingProps, GamblingState> {

    constructor(props: GamblingProps) {
        super(props);
        this.state = {
            customAmount: ''
        };
    }

    roundToCents(value: number) {
        return Math.round(value * 100) / 100;
    }

    setResultMessage(win: boolean, amount: number) {
        const verb = win ? 'won' : 'lost';
        const message = `You ${verb} $${amount.toFixed(2)}.`;
        this.setState({
            lastMessage: message,
            lastWin: win,
            lastAmount: amount
        });
    }

    handleGamble = (amount: number) => {
        const roundedAmount = this.roundToCents(amount);
        const roundedBalance = this.roundToCents(this.props.accountValue);
        if (!isFinite(roundedAmount) || roundedAmount <= 0) {
            this.setState({
                lastMessage: 'Enter a valid amount above $0.',
                lastWin: undefined,
                lastAmount: undefined
            });
            return;
        }
        if (roundedAmount > (roundedBalance + 0.0001)) {
            this.setState({
                lastMessage: 'You cannot bet more than your account balance.',
                lastWin: undefined,
                lastAmount: undefined
            });
            return;
        }

        const win = Math.random() < 0.5;
        const delta = win ? roundedAmount : -roundedAmount;
        this.props.changeAccountValue(delta);
        this.setResultMessage(win, roundedAmount);
    }

    handleGambleAll = () => {
        this.handleGamble(this.props.accountValue);
    }

    handleGambleHalf = () => {
        this.handleGamble(this.props.accountValue / 2);
    }

    handleCustomChange = (event: any) => {
        this.setState({ customAmount: event.target.value });
    }

    handleGambleCustom = () => {
        const amount = Number(this.state.customAmount);
        this.handleGamble(amount);
    }

    render() {
        const { accountValue } = this.props;
        const { customAmount, lastMessage, lastWin, lastAmount } = this.state;

        return (
        <div className="content">
            <Container fluid={true}>
                <Row>
                    <Col lg={8} md={10} xs={12}>
                        <div className="card">
                            <div className="content" style={{ padding: '24px' }}>
                                <h4 className="title" style={{ marginBottom: '10px' }}>
                                    <i className="pe-7s-rocket" style={{ marginRight: '8px' }}></i>
                                    Unbelievable Boat Bot
                                </h4>
                                <p className="category" style={{ marginBottom: '20px' }}>
                                    Gamble all, half, or any amount of your balance.
                                </p>

                                <div style={{
                                    backgroundColor: '#f7f7f7',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    marginBottom: '20px'
                                }}>
                                    <p style={{ margin: 0, fontWeight: 600 }}>
                                        Current Balance: <PriceTag value={accountValue} />
                                    </p>
                                </div>

                                <Row style={{ marginBottom: '16px' }}>
                                    <Col md={4} xs={12} style={{ marginBottom: '10px' }}>
                                        <Button
                                            variant="danger"
                                            size="lg"
                                            style={{ width: '100%' }}
                                            onClick={this.handleGambleAll}
                                            disabled={accountValue <= 0}
                                        >
                                            Gamble All
                                        </Button>
                                    </Col>
                                    <Col md={4} xs={12} style={{ marginBottom: '10px' }}>
                                        <Button
                                            variant="warning"
                                            size="lg"
                                            style={{ width: '100%' }}
                                            onClick={this.handleGambleHalf}
                                            disabled={accountValue <= 0}
                                        >
                                            Gamble Half
                                        </Button>
                                    </Col>
                                    <Col md={4} xs={12} style={{ marginBottom: '10px' }}>
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            style={{ width: '100%' }}
                                            onClick={this.handleGambleCustom}
                                            disabled={accountValue <= 0}
                                        >
                                            Gamble Custom
                                        </Button>
                                    </Col>
                                </Row>

                                <Row style={{ marginBottom: '16px' }}>
                                    <Col md={6} xs={12}>
                                        <label style={{ fontWeight: 600 }} htmlFor="customBet">
                                            Custom Amount
                                        </label>
                                        <input
                                            id="customBet"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="form-control"
                                            placeholder="Enter amount"
                                            value={customAmount}
                                            onChange={this.handleCustomChange}
                                        />
                                    </Col>
                                    <Col md={6} xs={12} style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <div style={{ fontSize: '13px', color: '#666' }}>
                                            Win/lose odds: 50/50. Win doubles your bet.
                                        </div>
                                    </Col>
                                </Row>

                                {lastMessage && (
                                    <div style={{
                                        backgroundColor: lastWin === undefined ? '#e9ecef' : (lastWin ? '#e8f5e9' : '#ffebee'),
                                        borderRadius: '6px',
                                        padding: '12px',
                                        fontSize: '14px'
                                    }}>
                                        {lastMessage}
                                        {lastAmount !== undefined && lastWin !== undefined && (
                                            <span style={{ marginLeft: '6px', fontWeight: 600 }}>
                                                {lastWin ? '🎉' : '💀'}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
        );
    }
}

const mapStateToProps = (state: AppState) => ({
    accountValue: state.depot.accountValue
});

// tslint:disable-next-line:no-any
const mapDispatchToProps = (dispatch: any) => ({
    changeAccountValue: (delta: number) => dispatch(changeAccountValue(delta))
});

export default connect(mapStateToProps, mapDispatchToProps)(Gambling);
