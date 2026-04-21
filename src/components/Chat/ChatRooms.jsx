import { ListGroup, Container } from "react-bootstrap";

function ChatRooms({ chatRooms }) {
    return (
        <Container className="mt-3">
            <ListGroup>
                {chatRooms.map((room) => (
                    <ListGroup.Item key={room.id} action href={`/chatRooms/${room.id}`}>
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