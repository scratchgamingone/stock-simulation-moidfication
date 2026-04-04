import * as React from 'react';
import { Container } from 'react-bootstrap';
import { FooterLink } from './FooterLink';

interface FooterProps {
}

interface FooterState {
}

export class Footer extends React.Component<FooterProps, FooterState> {

    constructor( props: FooterProps ) {
        super( props );
    }

    getFooterLinks() {
        return (
            <ul>
                <FooterLink to="https://github.com/stockmarkat/stockmarket-simulation">
                    Github
                </FooterLink>
            </ul>
        );
    }

    render() {
        return (
            <footer className="footer">
                <Container>
                    <nav className="pull-left small-padding-left">
                        {this.getFooterLinks()}
                    </nav>
                </Container>
            </footer>
        );
    }
}