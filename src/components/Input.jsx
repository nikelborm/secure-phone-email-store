import { memo } from "react";
import Form from "react-bootstrap/Form";

const Input = memo( ( { name, label, ...other } ) => (
    <Form.Group controlId={ name }>
        <Form.Label>
            { label }
        </Form.Label>
        <Form.Control
            name={ name }
            required
            { ...other }
        />
    </Form.Group>
) );
export default Input;
