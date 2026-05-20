import { ListGroup, Container } from "react-bootstrap";
import styles from "./ChatRooms.module.css";

function ChatRooms({ chatRooms, onSelectRoom, activeChatRoomId }) {
    return (
        <Container className={`mt-3 ${styles.sidebar}`} fluid>
            <div className={styles.header}>
                <h5 className={styles.title}>Chatrum</h5>
            </div>
            <ListGroup className={styles.roomList}>
                {chatRooms.map((room) => (
                    <ListGroup.Item
                        key={room.id}
                        action
                        className={`${styles.roomItem}`}
                        active={activeChatRoomId === room.id}
                        onClick={() => onSelectRoom?.(room)}
                        style={{
                            backgroundColor: room.active === false ? "#6b7a8d" : "transparent",
                            cursor: room.active === false ? "not-allowed" : "pointer",
                        }}
                    >
                        { room.name
                            ? <div className="fw-bold">{room.name}</div>
                            : <div className="fw-bold">Ukendt</div>
                        }
                        { room.message
                            ? <div className="text-muted small">{room.message}</div>
                            : <div className="text-muted small">...</div>
                        }
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </Container>
    );
}

export default ChatRooms;