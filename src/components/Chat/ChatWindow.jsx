import { useState, useEffect, useRef } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import { getMessages, sendMessage } from "../../services/messages";
import { getCurrentUser } from "../../services/auth";
import { getUsers } from "../../api/api";

export default function ChatWindow({ chatRoom, users = [] }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const currentUser = getCurrentUser();
    const [currentUserId, setCurrentUserId] = useState(currentUser?.id ?? null);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (currentUserId) return;
        getUsers()
            .then((users) => {
                const me = users.find((u) => u.email === currentUser?.email);
                if (me?.id) setCurrentUserId(me.id);
            })
            .catch(() => {});
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
    }, [messages]);

    async function handleSend(e) {
        e.preventDefault();
        if (!text.trim() || !currentUserId) return;
        setSending(true);
        try {
            await sendMessage({
                userId: currentUserId,
                chatRoomId: chatRoom.id,
                message: text.trim(),
            });
            setText("");
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
                                className={`p-2 rounded ${isOwn ? "bg-primary text-white" : "bg-light border text-dark"}`}
                                style={{ maxWidth: "70%" }}
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
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Skriv en besked..."
                    disabled={sending}
                />
                <Button type="submit" disabled={sending || !text.trim()}>
                    {sending ? <Spinner animation="border" size="sm" /> : "Send"}
                </Button>
            </Form>
        </div>
    );
}
