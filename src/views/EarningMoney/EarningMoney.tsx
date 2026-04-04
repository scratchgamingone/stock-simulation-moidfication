import * as React from 'react';
import { AppState } from '../../state/AppState';
import { connect } from 'react-redux';
import { Container, Row, Col } from 'react-bootstrap';
import { earnMoney as earnMoneyAction } from '../../state/upgrades/upgradesActions';
import { getTotalEarningsMultiplier } from '../../state/upgrades/upgradesSelector';
import EarnMoneyCard from '../Market/EarnMoneyCard/EarnMoneyCard';

interface EarningMoneyProps {
    earningsMultiplier: number;
    earnMoney: () => void;
}

class EarningMoney extends React.Component<EarningMoneyProps> {

    constructor(props: EarningMoneyProps) {
        super(props);
        console.log('[EARNING_MONEY] Constructor - props:', props);
    }

    render() {
        const { earnMoney, earningsMultiplier } = this.props;

        return (
            <div className="content">
                <Container fluid={true}>
                    <Row>
                        <Col lg={12} xs={12}>
                            <EarnMoneyCard 
                                onEarnMoney={earnMoney}
                                multiplier={earningsMultiplier}
                            />
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }
}

const mapStateToProps = (state: AppState) => ({
    earningsMultiplier: getTotalEarningsMultiplier(state)
});

const mapDispatchToProps = {
    earnMoney: earnMoneyAction
};

export default connect(mapStateToProps, mapDispatchToProps)(EarningMoney);
