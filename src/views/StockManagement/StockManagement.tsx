import * as React from 'react';
import { connect } from 'react-redux';
import { Col, Container, Row } from 'react-bootstrap';
import { AppState, Stock } from '../../state/AppState';
import { addCustomStock, deleteCustomStock } from '../../state/stockMarket/stockMarketActions';
import { AddStockCard } from '../Market/AddStockCard';

interface StockManagementProps {
    stocks: Stock[];
    addStock: (symbol: string, name: string, initialPrice: number) => void;
    deleteStock: (stockName: string) => void;
}

class StockManagement extends React.Component<StockManagementProps> {
    render() {
        const { stocks, addStock, deleteStock } = this.props;

        return (
            <div className="content">
                <Container fluid={true}>
                    <Row style={{ marginTop: '20px' }}>
                        <Col xs={12}>
                            <AddStockCard
                                onAddStock={addStock}
                                customStocks={stocks}
                                onDeleteStock={deleteStock}
                            />
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }
}

const mapStateToProps = (state: AppState) => ({
    stocks: state.stockMarket.stocks
});

const mapDispatchToProps = {
    addStock: addCustomStock,
    deleteStock: deleteCustomStock
};

export default connect(mapStateToProps, mapDispatchToProps)(StockManagement);
