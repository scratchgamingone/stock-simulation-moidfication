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
    jackpotBet: string;
    rouletteBet: string;
    roulettePick: string;
    highLowBet: string;
    highLowPick: 'HIGH' | 'LOW';
    lastMessage?: string;
    lastWin?: boolean;
    lastAmount?: number;
    winStreak: number;
    bestWinStreak: number;
    totalWagered: number;
    totalWon: number;
    gamesPlayed: number;
    jackpotPool: number;
    recentResults: Array<{
        id: string;
        game: string;
        amount: number;
        delta: number;
        won: boolean;
        note: string;
    }>;
}

class Gambling extends React.Component<GamblingProps, GamblingState> {

    constructor(props: GamblingProps) {
        super(props);
        this.state = {
            customAmount: '',
            jackpotBet: '',
            rouletteBet: '',
            roulettePick: '7',
            highLowBet: '',
            highLowPick: 'HIGH',
            winStreak: 0,
            bestWinStreak: 0,
            totalWagered: 0,
            totalWon: 0,
            gamesPlayed: 0,
            jackpotPool: 250,
            recentResults: []
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

    validateBet(amount: number): { ok: boolean; amount: number; message?: string } {
        const roundedAmount = this.roundToCents(amount);
        const roundedBalance = this.roundToCents(this.props.accountValue);

        if (!isFinite(roundedAmount) || roundedAmount <= 0) {
            return {
                ok: false,
                amount: 0,
                message: 'Enter a valid amount above $0.'
            };
        }

        if (roundedAmount > (roundedBalance + 0.0001)) {
            return {
                ok: false,
                amount: 0,
                message: 'You cannot bet more than your account balance.'
            };
        }

        return { ok: true, amount: roundedAmount };
    }

    trackResult(game: string, amount: number, delta: number, won: boolean, note: string) {
        const nextWinStreak = won ? this.state.winStreak + 1 : 0;
        const result = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            game,
            amount,
            delta,
            won,
            note
        };

        this.setState((prevState) => ({
            lastMessage: note,
            lastWin: won,
            lastAmount: amount,
            winStreak: nextWinStreak,
            bestWinStreak: Math.max(prevState.bestWinStreak, nextWinStreak),
            totalWagered: this.roundToCents(prevState.totalWagered + amount),
            totalWon: this.roundToCents(prevState.totalWon + (delta > 0 ? delta : 0)),
            gamesPlayed: prevState.gamesPlayed + 1,
            recentResults: [result, ...prevState.recentResults].slice(0, 10)
        }));
    }

    runStreakBonusCheck() {
        const nextStreak = this.state.winStreak + 1;
        if (nextStreak > 0 && nextStreak % 3 === 0) {
            const bonus = 25;
            this.props.changeAccountValue(bonus);
            this.setState((prevState) => ({
                lastMessage: `${prevState.lastMessage || ''} Streak bonus +$${bonus.toFixed(2)} awarded!`.trim(),
                totalWon: this.roundToCents(prevState.totalWon + bonus)
            }));
        }
    }

    handleGamble = (amount: number) => {
        const validation = this.validateBet(amount);
        if (!validation.ok) {
            this.setState({
                lastMessage: validation.message,
                lastWin: undefined,
                lastAmount: undefined
            });
            return;
        }

        const roundedAmount = validation.amount;
        const win = Math.random() < 0.5;
        const delta = win ? roundedAmount : -roundedAmount;
        this.props.changeAccountValue(delta);
        this.trackResult(
            'Coin Flip',
            roundedAmount,
            delta,
            win,
            win ? `Coin Flip: You won $${roundedAmount.toFixed(2)}.` : `Coin Flip: You lost $${roundedAmount.toFixed(2)}.`
        );

        if (win) {
            this.runStreakBonusCheck();
        }
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

    handleRoulette = () => {
        const amount = Number(this.state.rouletteBet);
        const validation = this.validateBet(amount);
        if (!validation.ok) {
            this.setState({
                lastMessage: validation.message,
                lastWin: undefined,
                lastAmount: undefined
            });
            return;
        }

        const chosen = Number(this.state.roulettePick);
        const spin = Math.floor(Math.random() * 10);
        const win = spin === chosen;
        const delta = win ? (validation.amount * 9) : -validation.amount;
        this.props.changeAccountValue(delta);

        this.trackResult(
            'Lucky Number',
            validation.amount,
            delta,
            win,
            win
                ? `Lucky Number: ${spin} hit! You won $${delta.toFixed(2)}.`
                : `Lucky Number: landed on ${spin}, not ${chosen}. You lost $${validation.amount.toFixed(2)}.`
        );

        if (win) {
            this.runStreakBonusCheck();
        }
    }

    handleHighLow = () => {
        const amount = Number(this.state.highLowBet);
        const validation = this.validateBet(amount);
        if (!validation.ok) {
            this.setState({
                lastMessage: validation.message,
                lastWin: undefined,
                lastAmount: undefined
            });
            return;
        }

        const rolled = 1 + Math.floor(Math.random() * 13);
        const isHigh = rolled >= 8;
        const pickHigh = this.state.highLowPick === 'HIGH';
        const win = isHigh === pickHigh;
        const delta = win ? (validation.amount * 0.9) : -validation.amount;
        this.props.changeAccountValue(delta);

        this.trackResult(
            'High / Low',
            validation.amount,
            delta,
            win,
            win
                ? `High / Low: card ${rolled}. You won $${delta.toFixed(2)}.`
                : `High / Low: card ${rolled}. You lost $${validation.amount.toFixed(2)}.`
        );

        if (win) {
            this.runStreakBonusCheck();
        }
    }

    handleJackpot = () => {
        const amount = Number(this.state.jackpotBet);
        const validation = this.validateBet(amount);
        if (!validation.ok) {
            this.setState({
                lastMessage: validation.message,
                lastWin: undefined,
                lastAmount: undefined
            });
            return;
        }

        const contribution = Math.max(5, validation.amount * 0.15);
        const nextPool = this.roundToCents(this.state.jackpotPool + contribution);
        const hit = Math.random() < 0.07;
        const jackpotWin = hit ? nextPool : 0;
        const delta = hit ? (jackpotWin - validation.amount) : -validation.amount;
        this.props.changeAccountValue(delta);

        this.setState({
            jackpotPool: hit ? 250 : nextPool
        });

        this.trackResult(
            'Jackpot',
            validation.amount,
            delta,
            hit,
            hit
                ? `Jackpot! You won $${jackpotWin.toFixed(2)} and reset the pool.`
                : `Jackpot miss. You added to the pool and lost $${validation.amount.toFixed(2)}.`
        );

        if (hit) {
            this.runStreakBonusCheck();
        }
    }

    render() {
        const { accountValue } = this.props;
        const {
            customAmount,
            jackpotBet,
            rouletteBet,
            roulettePick,
            highLowBet,
            highLowPick,
            lastMessage,
            lastWin,
            lastAmount,
            winStreak,
            bestWinStreak,
            totalWagered,
            totalWon,
            gamesPlayed,
            jackpotPool,
            recentResults
        } = this.state;

        const netResult = this.roundToCents(totalWon - Math.max(0, totalWagered - totalWon));

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
                                    Multiple game modes, jackpots, and win streak bonuses.
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

                                <hr />

                                <h5 style={{ marginTop: '10px', marginBottom: '10px' }}>Lucky Number (0-9)</h5>
                                <Row style={{ marginBottom: '16px' }}>
                                    <Col md={4} xs={12} style={{ marginBottom: '10px' }}>
                                        <label style={{ fontWeight: 600 }} htmlFor="rouletteBet">Bet</label>
                                        <input
                                            id="rouletteBet"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="form-control"
                                            placeholder="Enter amount"
                                            value={rouletteBet}
                                            onChange={(event: any) => this.setState({ rouletteBet: event.target.value })}
                                        />
                                    </Col>
                                    <Col md={4} xs={12} style={{ marginBottom: '10px' }}>
                                        <label style={{ fontWeight: 600 }} htmlFor="roulettePick">Pick Number</label>
                                        <select
                                            id="roulettePick"
                                            className="form-control"
                                            value={roulettePick}
                                            onChange={(event: any) => this.setState({ roulettePick: event.target.value })}
                                        >
                                            {[0,1,2,3,4,5,6,7,8,9].map((num) => (
                                                <option key={num} value={num}>{num}</option>
                                            ))}
                                        </select>
                                    </Col>
                                    <Col md={4} xs={12} style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <Button
                                            variant="info"
                                            size="lg"
                                            style={{ width: '100%' }}
                                            onClick={this.handleRoulette}
                                            disabled={accountValue <= 0}
                                        >
                                            Spin (9x payout)
                                        </Button>
                                    </Col>
                                </Row>

                                <h5 style={{ marginTop: '10px', marginBottom: '10px' }}>High / Low</h5>
                                <Row style={{ marginBottom: '16px' }}>
                                    <Col md={4} xs={12} style={{ marginBottom: '10px' }}>
                                        <label style={{ fontWeight: 600 }} htmlFor="highLowBet">Bet</label>
                                        <input
                                            id="highLowBet"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="form-control"
                                            placeholder="Enter amount"
                                            value={highLowBet}
                                            onChange={(event: any) => this.setState({ highLowBet: event.target.value })}
                                        />
                                    </Col>
                                    <Col md={4} xs={12} style={{ marginBottom: '10px' }}>
                                        <label style={{ fontWeight: 600 }} htmlFor="highLowPick">Pick</label>
                                        <select
                                            id="highLowPick"
                                            className="form-control"
                                            value={highLowPick}
                                            onChange={(event: any) => this.setState({ highLowPick: event.target.value as 'HIGH' | 'LOW' })}
                                        >
                                            <option value="HIGH">HIGH (8-13)</option>
                                            <option value="LOW">LOW (1-7)</option>
                                        </select>
                                    </Col>
                                    <Col md={4} xs={12} style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            style={{ width: '100%' }}
                                            onClick={this.handleHighLow}
                                            disabled={accountValue <= 0}
                                        >
                                            Draw Card (1.9x)
                                        </Button>
                                    </Col>
                                </Row>

                                <h5 style={{ marginTop: '10px', marginBottom: '10px' }}>Progressive Jackpot</h5>
                                <Row style={{ marginBottom: '20px' }}>
                                    <Col md={4} xs={12} style={{ marginBottom: '10px' }}>
                                        <label style={{ fontWeight: 600 }} htmlFor="jackpotBet">Bet</label>
                                        <input
                                            id="jackpotBet"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="form-control"
                                            placeholder="Enter amount"
                                            value={jackpotBet}
                                            onChange={(event: any) => this.setState({ jackpotBet: event.target.value })}
                                        />
                                    </Col>
                                    <Col md={4} xs={12} style={{ marginBottom: '10px', display: 'flex', alignItems: 'flex-end' }}>
                                        <div style={{ fontSize: '14px' }}>
                                            Current Pool: <strong>${jackpotPool.toFixed(2)}</strong>
                                        </div>
                                    </Col>
                                    <Col md={4} xs={12} style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <Button
                                            variant="dark"
                                            size="lg"
                                            style={{ width: '100%' }}
                                            onClick={this.handleJackpot}
                                            disabled={accountValue <= 0}
                                        >
                                            Try Jackpot (7% hit)
                                        </Button>
                                    </Col>
                                </Row>

                                <div style={{
                                    backgroundColor: '#f7f7f7',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    marginBottom: '20px'
                                }}>
                                    <Row>
                                        <Col md={3} xs={6}>
                                            <div style={{ fontSize: '12px', color: '#666' }}>Games Played</div>
                                            <div style={{ fontWeight: 700 }}>{gamesPlayed}</div>
                                        </Col>
                                        <Col md={3} xs={6}>
                                            <div style={{ fontSize: '12px', color: '#666' }}>Current Streak</div>
                                            <div style={{ fontWeight: 700 }}>{winStreak}</div>
                                        </Col>
                                        <Col md={3} xs={6}>
                                            <div style={{ fontSize: '12px', color: '#666' }}>Best Streak</div>
                                            <div style={{ fontWeight: 700 }}>{bestWinStreak}</div>
                                        </Col>
                                        <Col md={3} xs={6}>
                                            <div style={{ fontSize: '12px', color: '#666' }}>Total Wagered</div>
                                            <div style={{ fontWeight: 700 }}>${totalWagered.toFixed(2)}</div>
                                        </Col>
                                    </Row>
                                    <Row style={{ marginTop: '12px' }}>
                                        <Col md={6} xs={12}>
                                            <div style={{ fontSize: '12px', color: '#666' }}>Total Wins Collected</div>
                                            <div style={{ fontWeight: 700 }}>${totalWon.toFixed(2)}</div>
                                        </Col>
                                        <Col md={6} xs={12}>
                                            <div style={{ fontSize: '12px', color: '#666' }}>Estimated Net Session</div>
                                            <div style={{ fontWeight: 700, color: netResult >= 0 ? '#2e7d32' : '#c62828' }}>
                                                ${netResult.toFixed(2)}
                                            </div>
                                        </Col>
                                    </Row>
                                </div>

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

                                {recentResults.length > 0 && (
                                    <div style={{ marginTop: '18px' }}>
                                        <h6 style={{ marginBottom: '10px' }}>Recent Results</h6>
                                        <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '6px' }}>
                                            {recentResults.map((item) => (
                                                <div
                                                    key={item.id}
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderBottom: '1px solid #f0f0f0',
                                                        backgroundColor: item.won ? '#f3fbf4' : '#fff6f6'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                        <strong>{item.game}</strong>
                                                        <span style={{ color: item.delta >= 0 ? '#2e7d32' : '#c62828' }}>
                                                            {item.delta >= 0 ? '+' : ''}${item.delta.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{item.note}</div>
                                                </div>
                                            ))}
                                        </div>
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
