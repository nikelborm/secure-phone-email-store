import React, { Component } from "react";
import Input from "../../components/Input";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import loader from "../../tools/loader";

class RestoreUserPhone extends Component {
    state = {
        isSendingInProcess: false,
        showAlert: false,
        isError: false,
        reportinfo: ""
    }
    onSubmit = async event => {
        event.preventDefault();
        const email = event.target.elements.email.value;
        this.setState({
            isSendingInProcess: true
        });
        const response = await loader( "/restoreUserPhone", { email });
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
                <h1>Форма восстановления номера телефона</h1>
                <Form onSubmit={ this.onSubmit }>
                    <Input
                        type="email"
                        name="email"
                        placeholder="ivan@mail.ru"
                        label="Введите email адрес, на который придёт письмо с номером телефона:"
                    />
                    <Button variant="primary" type="submit" disabled={ this.state.isSendingInProcess }>
                        { this.state.isSendingInProcess
                            ? "Отправка запроса..."
                            : "Отправить запрос на восстановление"
                        }
                    </Button>
                </Form>
                { showAlert && (
                    <Alert variant={ isError ? "danger" : "success" } onClose={ this.clearAlert } dismissible>
                        <Alert.Heading>
                            { isError
                                ? "Ошибка при отправке запроса"
                                : "Запрос отправлен успешно успешно"
                            }
                        </Alert.Heading>
                        { reportinfo && <p>{ reportinfo }</p> }
                    </Alert>
                ) }
            </>
        );
    }
}

export default RestoreUserPhone;
