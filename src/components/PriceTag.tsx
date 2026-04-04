import * as React from 'react';

interface PriceTagProps {
    value?: number;
}

interface PriceTagState {
}

export class PriceTag extends React.PureComponent<PriceTagProps, PriceTagState> {
    constructor( props: PriceTagProps ) {
        super( props );
    }

    render() {
        const value = this.props.value;
        
        // Handle null, undefined, NaN, and non-finite values
        if ( value === null || value === undefined || !isFinite(value) ) {
            return '$ 0.00';
        }
        
        const valueAsString = value.toFixed( 2 ).toString();
        const formatedValue = valueAsString.replace( /\B(?=(\d{3})+(?!\d))/g, ',' );
        return (
            `$ ${formatedValue}`
        );
    }
}