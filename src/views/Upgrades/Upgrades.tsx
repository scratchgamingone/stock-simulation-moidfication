import * as React from 'react';
import { AppState } from '../../state/AppState';
import { connect } from 'react-redux';
import { Container, Row, Col } from 'react-bootstrap';
import { buyUpgrade as buyUpgradeAction } from '../../state/upgrades/upgradesActions';
import { getUpgrades } from '../../state/upgrades/upgradesSelector';
import UpgradesShop from '../Market/UpgradesShop/UpgradesShop';
import { Upgrade } from '../../state/upgrades/upgradesActions';

interface UpgradesProps {
    upgrades: Upgrade[];
    accountValue: number;
    buyUpgrade: (upgradeId: string) => void;
}

class Upgrades extends React.Component<UpgradesProps> {

    constructor(props: UpgradesProps) {
        super(props);
        console.log('[UPGRADES] Constructor - props:', props);
    }

    render() {
        const { upgrades, accountValue, buyUpgrade } = this.props;

        return (
            <div className="content">
                <Container fluid={true}>
                    <Row>
                        <Col lg={12} xs={12}>
                            <UpgradesShop 
                                upgrades={upgrades}
                                accountValue={accountValue}
                                onBuyUpgrade={buyUpgrade}
                            />
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }
}

const mapStateToProps = (state: AppState) => ({
    upgrades: getUpgrades(state),
    accountValue: state.depot.accountValue
});

const mapDispatchToProps = {
    buyUpgrade: buyUpgradeAction
};

export default connect(mapStateToProps, mapDispatchToProps)(Upgrades);
