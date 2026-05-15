import { Nav, Alert } from "react-bootstrap";

// Filters out tabs the user does not have access to before rendering
function HandbookTabs({ tabs, activeTab, onSelectTab, userRole }) {
    const accessibleTabs = tabs.filter(tab => tab.requiredRole === userRole || userRole === "ADMIN");

    if (accessibleTabs.length === 0) return (
        <Alert variant="warning">You do not have access to any tabs.</Alert>
    );

    return (
        <Nav variant="tabs" className="mb-3">
            {accessibleTabs.map(tab => (
                <Nav.Item key={tab.id}>
                    <Nav.Link
                        active={activeTab?.id === tab.id}
                        onClick={() => onSelectTab(tab)}
                    >
                        {tab.title}
                    </Nav.Link>
                </Nav.Item>
            ))}
        </Nav>
    );
}

export default HandbookTabs;