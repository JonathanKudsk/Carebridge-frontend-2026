import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    Container,
    Card,
    Form,
    Button,
    Alert,
    Spinner
} from "react-bootstrap";

import api from "../services/api";
import { getResidentById } from "../api/api";

export default function CreateBudgetPage() {

    const { id } = useParams();

    const [resident, setResident] = useState(null);

    const [income, setIncome] = useState("");
    const [fixedExpenses, setFixedExpenses] = useState("");
    const [variableExpenses, setVariableExpenses] = useState("");
    const [pocketMoneyAmount, setPocketMoneyAmount] = useState("");
    const [savingsAmount, setSavingsAmount] = useState("");
    const [notes, setNotes] = useState("");

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {

        async function fetchResident() {

            try {

                const data = await getResidentById(id);

                setResident(data);

            } catch (err) {

                console.error(err);

                setError("Kunne ikke hente resident");
            } finally {

                setLoading(false);
            }
        }

        fetchResident();

    }, [id]);

    async function handleSubmit(e) {

        e.preventDefault();

        setError("");
        setMessage("");

        try {

            await api.post("/budgets/create", {
                income: Number(income),
                fixedExpenses: Number(fixedExpenses),
                variableExpenses: Number(variableExpenses),
                pocketMoneyAmount: Number(pocketMoneyAmount),
                savingsAmount: Number(savingsAmount),
                notes,
                residentId: resident.id
            });

            setMessage("Budget oprettet!");

        } catch (err) {

            console.error(err);

            setError(
                err?.response?.data ||
                "Noget gik galt"
            );
        }
    }

    if (loading) {
        return <Spinner />;
    }

    return (
        <Container className="mt-4">

            <Card className="shadow-sm">

                <Card.Header>
                    <h3>Opret Budget</h3>
                </Card.Header>

                <Card.Body>

                    {resident && (
                        <div className="mb-4">
                            <h5>
                                {resident.firstName} {resident.lastName}
                            </h5>

                            <p>
                                CPR: {resident.cprNr}
                            </p>
                        </div>
                    )}

                    {message && (
                        <Alert variant="success">
                            {message}
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="danger">
                            {error}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>

                        <Form.Group className="mb-3">
                            <Form.Label>Income</Form.Label>

                            <Form.Control
                                type="number"
                                value={income}
                                onChange={(e) =>
                                    setIncome(e.target.value)
                                }
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Fixed Expenses</Form.Label>

                            <Form.Control
                                type="number"
                                value={fixedExpenses}
                                onChange={(e) =>
                                    setFixedExpenses(e.target.value)
                                }
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Variable Expenses</Form.Label>

                            <Form.Control
                                type="number"
                                value={variableExpenses}
                                onChange={(e) =>
                                    setVariableExpenses(e.target.value)
                                }
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Pocket Money</Form.Label>

                            <Form.Control
                                type="number"
                                value={pocketMoneyAmount}
                                onChange={(e) =>
                                    setPocketMoneyAmount(e.target.value)
                                }
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Savings</Form.Label>

                            <Form.Control
                                type="number"
                                value={savingsAmount}
                                onChange={(e) =>
                                    setSavingsAmount(e.target.value)
                                }
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Notes</Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={notes}
                                onChange={(e) =>
                                    setNotes(e.target.value)
                                }
                            />
                        </Form.Group>

                        <Button type="submit">
                            Opret Budget
                        </Button>

                    </Form>

                </Card.Body>
            </Card>
        </Container>
    );
}