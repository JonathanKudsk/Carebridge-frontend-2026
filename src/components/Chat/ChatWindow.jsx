import { useState, useEffect, useRef } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import { getMessages, sendMessage } from "../../services/messages";
import { getCurrentUser } from "../../services/auth";
import { getUsers } from "../../api/api";

export default function ChatWindow({ chatRoom, users = [], onLastMessage }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const currentUser = getCurrentUser();
    const isEmployed = currentUser?.isEmployed ?? true;
    const [currentUserId, setCurrentUserId] = useState(currentUser?.id ?? null);
    const bottomRef = useRef(null);
    const [messageError, setMessageError] = useState("");

    useEffect(() => {
        if (currentUserId) return;
        getUsers()
            .then((users) => {
                const me = users.find((u) => u.email === currentUser?.email);
                if (me?.id) setCurrentUserId(me.id);
            })
            .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!chatRoom?.id) return;
        setLoading(true);
        getMessages(chatRoom.id)
            .then(setMessages)
            .catch(console.error)
            .finally(() => setLoading(false));

        let interval = null;
        const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}/ws/chatrooms/${chatRoom.id}`);
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages((prev) => prev.some((m) => m.id === message.id) ? prev : [...prev, message]);
        };
        ws.onerror = () => {
            interval = setInterval(() => {
                getMessages(chatRoom.id).then(setMessages).catch(console.error);
            }, 3000);
        };

        return () => {
            ws.close();
            if (interval) clearInterval(interval);
        };
    }, [chatRoom?.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        if (messages.length > 0) {
            onLastMessage?.(chatRoom.id, messages[messages.length - 1].message);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages]);

    const validateMessage = (message) => {
        if (!message || message.trim().length === 0) {
            return "Beskeden kan ikke være tom.";
        }
        if (message.length > 2000) {
            return "Beskeden kan ikke være længere end 2000 tegn.";
        }
        return null;
    }

    async function handleSend(e) {
        e.preventDefault();

        const error = validateMessage(text);
        if (error) {
            setMessageError(error);
            return;
        }


        if (!currentUserId) return;
        setSending(true);
        try {
            await sendMessage({
                userId: currentUserId,
                chatRoomId: chatRoom.id,
                message: text.trim(),
            });
            setText("");
            setMessageError("");
        } catch (err) {
            console.error("Send failed", err);
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="d-flex flex-column" style={{ flex: 1, overflow: "hidden" }}>
            <div className="flex-grow-1 overflow-auto p-3">
                {loading && <Spinner animation="border" size="sm" />}
                {messages.map((msg) => {
                    const isOwn = msg.userId === currentUserId;
                    return (
                        <div
                            key={msg.id}
                            className={`d-flex mb-2 ${isOwn ? "justify-content-end" : "justify-content-start"}`}
                        >
                            <div
                              className={`p-2 rounded ${
                                    chatRoom?.active === false
                                    ? "bg-secondary"
                                    : (isOwn ? "bg-primary text-white" : "bg-light border text-dark")
                                }`}
                                style={{ 
                                    maxWidth: "70%"          
                                }}
                            >
                                {!isOwn && (
                                    <div className="fw-bold small">
                                        {msg.userName || users.find((u) => u.id === msg.userId)?.name || "Ukendt"}
                                    </div>
                                )}
                                <div>{msg.message}</div>
                                {msg.timestamp && (
                                    <div
                                        className="text-end opacity-75"
                                        style={{ fontSize: "0.7rem" }}
                                    >
                                        {new Date(msg.timestamp).toLocaleTimeString("da-DK", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
       <Form onSubmit={handleSend} className="p-3 border-top d-flex gap-2">
                <Form.Control
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        setMessageError("");
                    }}
                    placeholder={!isEmployed || chatRoom?.active === false ? "Du kan ikke sende beskeder længere" : "Skriv en besked..."}
                    disabled={sending || !isEmployed || chatRoom?.active === false}
                    isInvalid={!!messageError}
                />
                {messageError && (
                    <Form.Control.Feedback type="invalid" className="d-block">
                        {messageError}
                    </Form.Control.Feedback>
                )}
                <Button type="submit" 
                        disabled={sending || !text.trim() || !!messageError || !isEmployed || chatRoom.active === false}
                        style={{
                             backgroundColor: (sending || !text.trim() || !!messageError || chatRoom?.active === false) ? "#6b7a8d" : undefined,
                             borderColor: (sending || !text.trim() || !!messageError || !isEmployed || chatRoom?.active === false) ? "#6b7a8d" : undefined,
                        }}>
                    {sending ? <Spinner animation="border" size="sm" /> : "Send"}
                </Button>
            </Form>
        </div>
    );
}
