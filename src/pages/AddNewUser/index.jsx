import React, { Component } from "react";
import Input from "../../components/Input";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import loader from "../../tools/loader";

class AddNewUserPage extends Component {
    state = {
        isSendingInProcess: false,
        showAlert: false,
        isError: false,
        reportinfo: ""
    }
    onSubmit = async event => {
        event.preventDefault();
        const { email: { value: email }, phone: { value: phone } } = event.target.elements;
        this.setState({
            isSendingInProcess: true
        });
        const response = await loader( "/addNewUser", { email, phone });
        this.setState({
            showAlert: true,
            isSendingInProcess: false,
            reportinfo: response.report.info,
            isError: response.report.isError
        });
        clearTimeout( this.alertTimeout );
        this.alertTimeout = setTimeout( this.clearAlert, 10000 );
    };
    alertTimeout = null;
    componentWillUnmount() {
        clearTimeout( this.alertTimeout );
    }
    clearAlert = () => {
        this.setState( { showAlert: false } );
        clearTimeout( this.alertTimeout );
    };
    render() {
        const { showAlert, isError, reportinfo } = this.state;
        return (
            <>
                <h1>Форма добавления нового пользователя</h1>
                <Form onSubmit={ this.onSubmit }>
                    <Input
                        type="email"
                        name="email"
                        placeholder="ivan@mail.ru"
                        label="Введите email адрес:"
                    />
                    <Input
                        type="tel"
                        pattern="8[0-9]{10}"
                        name="phone"
                        placeholder="88005553535"
                        label="Введите номер телефона, начиная с 8 без спец символов:"
                    />
                    <Button variant="primary" type="submit" disabled={ this.state.isSendingInProcess }>
                        { this.state.isSendingInProcess
                            ? "Создание пользователя..."
                            : "Добавить пользователя"
                        }
                    </Button>
                </Form>
                { showAlert && (
                    <Alert variant={ isError ? "danger" : "success" } onClose={ this.clearAlert } dismissible>
                        <Alert.Heading>
                            { isError
                                ? "Ошибка при отправке запроса"
                                : "Пользователь успешно создан"
                            }
                        </Alert.Heading>
                        { reportinfo && <p>{ reportinfo }</p> }
                    </Alert>
                ) }
            </>
        );
    }
}

export default AddNewUserPage;
