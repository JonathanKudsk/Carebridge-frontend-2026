import { Alert } from "react-bootstrap";
import "./handbook-editor.css";

function HandbookContent({ tab }) {
    if (!tab || typeof tab !== "object") {
        return (
            <Alert variant="info" className="mt-2">
                Select a tab to view its content.
            </Alert>
        );
    }

    const hasContent = tab.content && typeof tab.content === "string" && tab.content.trim() !== "";

    if (!hasContent) {
        return (
            <Alert variant="secondary" className="mt-2 bg-dark-subtle text-light border-secondary">
                This tab has no content yet.
            </Alert>
        );
    }

    return (
        <div
            className="handbook-editor-content tiptap border border-secondary-subtle rounded bg-dark-subtle text-light mt-2"
            dangerouslySetInnerHTML={{ __html: tab.content }}
        />
    );
}

export default HandbookContent;