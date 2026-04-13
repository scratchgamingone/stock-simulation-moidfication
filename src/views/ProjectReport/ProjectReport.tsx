import * as React from 'react';
import { connect } from 'react-redux';
import { Card, Row, Col } from 'react-bootstrap';
import { AppState, Stock } from '../../state/AppState';
import { getStocksByOwnedQuantity } from '../../state/stockMarket/stockSelector';

interface ProjectReportProps {
    stocks: Stock[];
    accountValue: number;
    transactionCount: number;
}

class ProjectReport extends React.Component<ProjectReportProps> {
    formatCurrency(value: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    }

    render() {
        const ownedStocks = this.props.stocks.filter((stock) => stock.quantity > 0);
        const stockValue = ownedStocks.reduce((sum, stock) => sum + (stock.quantity * stock.value), 0);
        const totalPortfolioValue = stockValue + this.props.accountValue;

        return (
            <div className="content">
                <div className="container-fluid">
                    <Row>
                        <Col md={12}>
                            <h3>
                                <i className="pe-7s-note2" style={{ marginRight: '10px' }}></i>
                                Methods and Assumptions Report
                            </h3>
                            <p className="text-muted" style={{ marginBottom: '20px' }}>
                                Admissions-ready summary of methodology, assumptions, limitations, and reproducibility.
                            </p>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={4}>
                            <Card>
                                <Card.Body>
                                    <p className="card-category">Current Portfolio Value</p>
                                    <h4>{this.formatCurrency(totalPortfolioValue)}</h4>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card>
                                <Card.Body>
                                    <p className="card-category">Owned Positions</p>
                                    <h4>{ownedStocks.length}</h4>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card>
                                <Card.Body>
                                    <p className="card-category">Recorded Transactions</p>
                                    <h4>{this.props.transactionCount}</h4>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">Methods</Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <ol>
                                        <li>Daily return modeling with simple returns from stock price history.</li>
                                        <li>Dispersion and risk estimated by sample standard deviation and annualization using sqrt(252).</li>
                                        <li>Tail risk measured by 95% Value at Risk on empirical return distribution.</li>
                                        <li>Downside-adjusted performance measured by Sortino ratio.</li>
                                        <li>Market sensitivity estimated using beta against an equal-weight benchmark of owned stocks.</li>
                                        <li>Diversification profile assessed via pairwise return correlation matrix.</li>
                                        <li>Path-dependent loss quantified using drawdown and maximum drawdown.</li>
                                    </ol>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">Assumptions</Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <ol>
                                        <li>Trading calendar approximation uses 252 sessions per year.</li>
                                        <li>Risk-free rate approximation uses 2% annual baseline.</li>
                                        <li>Price history snapshots are representative of realized daily behavior.</li>
                                        <li>Empirical distribution methods assume recent history is informative.</li>
                                        <li>Benchmark proxy assumes equal-weight basket of currently owned stocks.</li>
                                    </ol>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">Limitations</Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <ol>
                                        <li>No slippage, transaction costs, or tax drag in performance modeling.</li>
                                        <li>Small sample windows can produce unstable metrics.</li>
                                        <li>Historical estimates may fail under regime shifts.</li>
                                        <li>VaR does not fully describe worst-case tail severity.</li>
                                        <li>Beta and correlation are linear measures and can miss nonlinear dynamics.</li>
                                    </ol>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">Reproducibility Checklist</Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <ol>
                                        <li>Use Data Management page to export a backup snapshot before analysis.</li>
                                        <li>Record snapshot date/time and active owned-stock universe.</li>
                                        <li>Document selected graph mode (per-stock, weighted, or category).</li>
                                        <li>Capture key outputs: mean return, volatility, Sortino, beta, VaR, max drawdown.</li>
                                        <li>Re-run after new transactions and compare drift in metrics.</li>
                                    </ol>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Card>
                                <Card.Header>
                                    <Card.Title as="h4">How to Present This as a Stats-Major Project</Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <p style={{ marginBottom: '10px' }}>
                                        Recommended framing: Applied Statistical Analytics Platform for Portfolio Risk and Behavior.
                                    </p>
                                    <ol>
                                        <li>Emphasize uncertainty quantification and risk diagnostics over prediction hype.</li>
                                        <li>Highlight interpretation discipline: each formula has a user-facing meaning.</li>
                                        <li>Show model assumptions and failure modes explicitly.</li>
                                        <li>Demonstrate reproducibility through snapshot-based re-analysis.</li>
                                        <li>Tie CS skills to stats outcomes: pipeline reliability, visualization clarity, and auditability.</li>
                                    </ol>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state: AppState) => ({
    stocks: getStocksByOwnedQuantity(state),
    accountValue: state.depot.accountValue,
    transactionCount: (state as any).transactions?.transactions?.length || 0
});

export default connect(mapStateToProps)(ProjectReport);
