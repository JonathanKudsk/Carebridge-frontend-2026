import { Nav, Alert } from "react-bootstrap";
import { createTab } from "../../services/handbook.js";

function HandbookTabs({ tabs, activeTab, onSelectTab, userRole, handbookId, onTabCreated }) {
    const isAdmin = userRole === "ADMIN";

    const handleNewTab = async () => {
        const title = prompt("Fanens navn:");
        if (!title || title.trim() === "") return;
        const newTab = await createTab(handbookId, title.trim());
        onTabCreated(newTab);
    };

    if (tabs.length === 0 && !isAdmin) return (
        <Alert variant="warning">You do not have access to any tabs.</Alert>
    );

    return (
        <Nav variant="tabs" className="mb-3">
            {tabs.map(tab => (
                <Nav.Item key={tab.id}>
                    <Nav.Link
                        active={activeTab?.id === tab.id}
                        onClick={() => onSelectTab(tab)}
                    >
                        {tab.title}
                    </Nav.Link>
                </Nav.Item>
            ))}
            {isAdmin && (
                <Nav.Item>
                    <Nav.Link onClick={handleNewTab}>+</Nav.Link>
                </Nav.Item>
            )}
        </Nav>
    );
}

export default HandbookTabs;