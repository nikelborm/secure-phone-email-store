import { StrictMode } from "react";
import Container from "react-bootstrap/Container";
import { Route, Switch, Redirect, BrowserRouter } from "react-router-dom";

import AddNewUserPage from "./pages/AddNewUser";
import RestoreUserPhonePage from "./pages/RestoreUserPhone";

import Menu from "./components/Menu";
import Divider from "./components/Divider";
const App = () => (
    <StrictMode>
        <Container>
            <BrowserRouter>
                <Menu/>
                <Divider/>
                <Switch>
                    <Route component={ AddNewUserPage }       path="/addNewUser"       exact/>
                    <Route component={ RestoreUserPhonePage } path="/restoreUserPhone" exact/>
                    <Route path="*">
                        <Redirect to="/addNewUser"/>
                    </Route>
                </Switch>
            </BrowserRouter>
        </Container>
    </StrictMode>
);

export default App;
