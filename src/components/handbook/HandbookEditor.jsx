import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { updateTabContent } from "../../api/handbookApi.js";
import HandbookToolbar from "./HandbookToolbar.jsx";

function HandbookEditor({ tab, onSaved }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({ openOnClick: false }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: tab.content,
        onUpdate: () => setIsDirty(true),
    }, [tab.id]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const html = editor.getHTML();
            await updateTabContent(tab.id, html);
            setIsDirty(false);
            onSaved?.();
        } catch {
            setError("Could not save content. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="handbook-editor">
            {isDirty && (
                <Alert variant="warning" className="py-2">
                    You have unsaved changes.
                </Alert>
            )}
            {error && (
                <Alert variant="danger" className="py-2">
                    {error}
                </Alert>
            )}
            <HandbookToolbar editor={editor} />
            <EditorContent editor={editor} className="border rounded p-3 mt-2" />
            <div className="d-flex justify-content-end mt-2">
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                >
                    {saving ? <Spinner animation="border" size="sm" /> : "Save"}
                </Button>
            </div>
        </div>
    );
}

export default HandbookEditor;