import { Alert } from "react-bootstrap";

// Renders the raw HTML content from the TipTap editor
function HandbookContent({ tab }) {
    if (!tab) return (
        <Alert variant="info">Select a tab to view its content.</Alert>
    );

    if (!tab.content || tab.content.trim() === "") return (
        <Alert variant="secondary">This tab has no content yet.</Alert>
    );

    return (
        <div
            className="handbook-content p-3 border rounded"
            dangerouslySetInnerHTML={{ __html: tab.content }}
        />
    );
}

export default HandbookContent;