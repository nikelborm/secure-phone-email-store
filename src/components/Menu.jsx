import React, { PureComponent, Component } from "react";
import { withRouter } from "react-router";
import Nav from "react-bootstrap/Nav";
import LinkContainer from "react-router-bootstrap/lib/LinkContainer";

class MenuPoint extends PureComponent {
    render() {
        const { to, text } = this.props;
        return (
            <Nav.Item>
                <LinkContainer to={ to }>
                    <Nav.Link children={ text }/>
                </LinkContainer>
            </Nav.Item>
        );
    }
}

const sets = {
    "/restoreUserPhone": React.memo( () => <MenuPoint to="/addNewUser"       text="Добавить нового пользователя..." /> ),
    "/addNewUser":       React.memo( () => <MenuPoint to="/restoreUserPhone" text="Восстановить номер телефона..."  /> )
}

class Menu extends Component {
    render() {
        const path = this.props.location.pathname;
        return (
            <Nav
                className="justify-content-center"
                children={ path in sets
                    ? React.createElement( sets[ path ] )
                    : ""
                }
            />
        );
    }
}

export default withRouter( Menu );
