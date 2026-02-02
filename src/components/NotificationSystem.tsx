/* tslint:disable*/
import * as React from 'react';
// @ts-ignore
import * as NotificationSystem from 'react-notification-system';

interface NotificationSystemProps {
}

interface NotificationSystemState {
}

export let notificationSystem: any = null;

export function addNotification(notification: NotificationSystem.Notification) {
    if (notificationSystem) {
        notification.position = 'tr';
        notificationSystem.addNotification(notification);
    }
}

export class NotificationSystemFrame extends React.Component<NotificationSystemProps, NotificationSystemState> {

    constructor(props: NotificationSystemProps) {
        super(props);
    }

    componentDidMount(): void {
        notificationSystem = this.refs.notificationSystem;
    }

    render() {
        return (
            // @ts-ignore
            <NotificationSystem ref="notificationSystem"/>
        );
    }
}