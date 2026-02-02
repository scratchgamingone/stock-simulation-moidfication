import * as React from 'react';
import { Button, Col, Row, Card, Badge } from 'react-bootstrap';
import { getTotalEarningsMultiplier } from '../../../state/upgrades/upgradesSelector';

interface EarnMoneyCardProps {
    onEarnMoney: () => void;
    multiplier: number;
}

interface EarnMoneyCardState {
    isSpinning: boolean;
    lastEarned?: number;
}

class EarnMoneyCard extends React.Component<EarnMoneyCardProps, EarnMoneyCardState> {
    private spinTimeout?: NodeJS.Timeout;

    constructor(props: EarnMoneyCardProps) {
        super(props);
        this.state = {
            isSpinning: false,
            lastEarned: undefined
        };
    }

    handleEarnMoney = () => {
        if (this.state.isSpinning) return;

        this.setState({ isSpinning: true });

        // Simulate animation for 1 second
        this.spinTimeout = setTimeout(() => {
            this.props.onEarnMoney();
            this.setState({ isSpinning: false });
        }, 1000);
    };

    componentWillUnmount() {
        if (this.spinTimeout) {
            clearTimeout(this.spinTimeout);
        }
    }

    render() {
        const { isSpinning } = this.state;
        const { multiplier } = this.props;
        const displayMultiplier = multiplier ? multiplier : 1;
        const maxEarning = Math.floor(1000 * displayMultiplier);

        return (
            <div className={'card'}>
                <div className="content">
                    <div style={{ padding: '20px' }}>
                        <h4 className="title" style={{ marginBottom: '20px' }}>
                            <i className="pe-7s-piggy" style={{ marginRight: '10px' }}></i>
                            Earn Money
                        </h4>

                        <div style={{
                            textAlign: 'center',
                            padding: '30px 20px',
                            backgroundColor: '#f9f9f9',
                            borderRadius: '8px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ color: '#666', marginBottom: '5px' }}>Potential Earnings</p>
                                <h3 style={{ fontSize: '24px', color: '#28a745', margin: '0' }}>
                                    $1 - ${maxEarning}
                                </h3>
                                <small style={{ color: '#999' }}>
                                    Base: $1 - $1,000 | Multiplier: {displayMultiplier.toFixed(2)}x
                                </small>
                            </div>

                            <Button
                                variant={isSpinning ? 'secondary' : 'success'}
                                size="lg"
                                onClick={this.handleEarnMoney}
                                disabled={isSpinning}
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    fontSize: '16px',
                                    transition: 'transform 0.2s',
                                    transform: isSpinning ? 'scale(1.05)' : 'scale(1)'
                                }}
                            >
                                <i 
                                    className={`pe-7s-${isSpinning ? 'refresh-2' : 'note'}`} 
                                    style={{ 
                                        marginRight: '8px',
                                        animation: isSpinning ? 'spin 1s linear' : 'none'
                                    }}
                                ></i>
                                {isSpinning ? 'Earning...' : 'Click to Earn Money'}
                            </Button>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <h6 style={{ color: '#666', marginBottom: '10px' }}>
                                Earnings Information
                            </h6>
                            <div style={{
                                backgroundColor: '#e8f5e9',
                                padding: '12px',
                                borderRadius: '4px',
                                fontSize: '13px',
                                lineHeight: '1.6'
                            }}>
                                <p style={{ margin: '0' }}>
                                    ✓ Earn random amounts from $1 to ${maxEarning}
                                </p>
                                <p style={{ margin: '5px 0 0 0' }}>
                                    ✓ Each click can earn you money for stock purchases
                                </p>
                                <p style={{ margin: '5px 0 0 0' }}>
                                    ✓ Multiplier increases with active upgrades
                                </p>
                            </div>
                        </div>

                        {displayMultiplier > 1 && (
                            <div style={{
                                backgroundColor: '#fff3cd',
                                padding: '12px',
                                borderRadius: '4px',
                                fontSize: '13px'
                            }}>
                                <p style={{ margin: '0' }}>
                                    🚀 <strong>Boost Active:</strong> You have {displayMultiplier.toFixed(2)}x earnings multiplier!
                                </p>
                            </div>
                        )}

                        <style>{`
                            @keyframes spin {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                </div>
            </div>
        );
    }
}

export default EarnMoneyCard;
