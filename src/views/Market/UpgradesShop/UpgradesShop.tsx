import * as React from 'react';
import { Button, Col, Row, ListGroup, ProgressBar } from 'react-bootstrap';
import { Upgrade } from '../../../state/upgrades/upgradesActions';

interface UpgradesShopProps {
    upgrades: Upgrade[];
    accountValue: number;
    onBuyUpgrade: (upgradeId: string) => void;
}

interface UpgradesShopState {
    selectedUpgrade?: string;
}

class UpgradesShop extends React.Component<UpgradesShopProps, UpgradesShopState> {
    constructor(props: UpgradesShopProps) {
        super(props);
        this.state = {
            selectedUpgrade: undefined
        };
    }

    canAfford = (cost: number) => {
        const { accountValue } = this.props;
        return accountValue && accountValue >= cost;
    };

    isMaxLevel = (upgrade: Upgrade) => {
        return upgrade.level >= upgrade.maxLevel;
    };

    render() {
        const { upgrades, accountValue, onBuyUpgrade } = this.props;
        const displayBalance = accountValue ? accountValue : 0;

        return (
            <div className={'card'}>
                <div className="content">
                    <div style={{ padding: '20px' }}>
                        <h4 className="title" style={{ marginBottom: '20px' }}>
                            <i className="pe-7s-shine" style={{ marginRight: '10px' }}></i>
                            Upgrades Shop
                        </h4>

                        <div style={{
                            backgroundColor: '#f0f7ff',
                            padding: '12px',
                            borderRadius: '4px',
                            marginBottom: '20px',
                            fontSize: '13px'
                        }}>
                            <p style={{ margin: '0' }}>
                                💰 <strong>Balance:</strong> ${displayBalance.toFixed(2)}
                            </p>
                        </div>

                        <ListGroup style={{ marginBottom: '15px' }}>
                            {upgrades && upgrades.length > 0 ? (
                                upgrades.map((upgrade, index) => {
                                    const canAfford = this.canAfford(upgrade.cost);
                                    const isMaxed = this.isMaxLevel(upgrade);
                                    const progressPercent = (upgrade.level / upgrade.maxLevel) * 100;
                                    const cost = upgrade.cost ? upgrade.cost : 0;

                                    return (
                                        <ListGroup.Item
                                            key={upgrade.id}
                                            style={{
                                                backgroundColor: isMaxed ? '#f0f0f0' : 'white',
                                                opacity: isMaxed ? 0.7 : 1
                                            }}
                                        >
                                            <Row style={{ alignItems: 'center', gap: '10px' }}>
                                                <Col xs={12} sm={6}>
                                                    <div>
                                                        <strong>{upgrade.name}</strong>
                                                        {isMaxed && (
                                                            <span style={{
                                                                marginLeft: '8px',
                                                                backgroundColor: '#28a745',
                                                                color: 'white',
                                                                padding: '2px 8px',
                                                                borderRadius: '3px',
                                                                fontSize: '11px'
                                                            }}>
                                                                MAX
                                                            </span>
                                                        )}
                                                        <br />
                                                        <small style={{ color: '#666' }}>
                                                            {upgrade.description}
                                                        </small>
                                                        <div style={{ marginTop: '8px' }}>
                                                            <ProgressBar
                                                                now={progressPercent}
                                                                label={`${upgrade.level}/${upgrade.maxLevel}`}
                                                                style={{ height: '20px', fontSize: '11px' }}
                                                                variant={isMaxed ? 'success' : 'info'}
                                                            />
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col xs={12} sm={6}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ marginBottom: '8px' }}>
                                                            <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>
                                                                ${cost.toFixed(2)}
                                                            </p>
                                                            <small style={{ color: '#999' }}>
                                                                Multiplier: {upgrade.multiplier.toFixed(2)}x
                                                            </small>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant={
                                                                isMaxed
                                                                    ? 'secondary'
                                                                    : canAfford
                                                                        ? 'primary'
                                                                        : 'outline-danger'
                                                            }
                                                            onClick={() => onBuyUpgrade(upgrade.id)}
                                                            disabled={isMaxed || !canAfford}
                                                            style={{ width: '100%' }}
                                                        >
                                                            {isMaxed ? '✓ Maxed' : canAfford ? 'Buy' : 'No Money'}
                                                        </Button>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </ListGroup.Item>
                                    );
                                })
                            ) : (
                                <ListGroup.Item>
                                    <p style={{ margin: '0', color: '#999' }}>No upgrades available</p>
                                </ListGroup.Item>
                            )}
                        </ListGroup>

                        <div style={{
                            backgroundColor: '#fff3cd',
                            padding: '12px',
                            borderRadius: '4px',
                            fontSize: '13px'
                        }}>
                            <p style={{ margin: '0' }}>
                                💡 <strong>Tip:</strong> Each upgrade level increases your earnings multiplier. Buy upgrades to maximize your earning potential!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default UpgradesShop;
