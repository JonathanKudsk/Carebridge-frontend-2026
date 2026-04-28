import { ListGroup, Container } from "react-bootstrap";

function ChatRooms({ chatRooms, onSelectRoom, activeChatRoomId }) {
    return (
        <Container className="mt-3">
            <ListGroup>
                {chatRooms.map((room) => (
                    <ListGroup.Item
                        key={room.id}
                        action
                        active={activeChatRoomId === room.id}
                        onClick={() => onSelectRoom?.(room)}
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