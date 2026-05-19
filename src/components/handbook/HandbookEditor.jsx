import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

import { useState, useEffect, useCallback } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { updateTabContent, deleteTab } from "../../services/handbook.js";
import HandbookToolbar from "./HandbookToolbar.jsx";
import "./handbook-editor.css";

function HandbookEditor({ tab, onSaved, onTabDeleted }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                autolink: true,
                linkOnPaste: true,
            }),
            Placeholder.configure({
                placeholder: "Start writing handbook content...",
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
        ],
        content: tab?.content || "",
        editorProps: {
            attributes: {
                class: "handbook-editor-content tiptap",
            },
        },
        onUpdate: () => {
            setIsDirty(true);
        },
    }); // REMOVED [tab?.id] here to stop the crash loop when switching tabs

    // Keep editor content perfectly in sync when tab selection state changes
    useEffect(() => {
        if (editor && tab) {
            const currentHTML = editor.getHTML();
            const targetHTML = tab.content || "";
            if (currentHTML !== targetHTML) {
                editor.commands.setContent(targetHTML);
                // Clear dirty tracking flag on clean load
                setIsDirty(false);
            }
        }
    }, [tab?.id, editor]); // Targets tab ID mutation cleanly without destroying instance state

    const handleSave = useCallback(async () => {
        if (!editor || saving || !isDirty || !tab?.id) return;

        setSaving(true);
        setError(null);

        try {
            const html = editor.getHTML();
            const updatedTab = await updateTabContent(tab.id, html);
            setIsDirty(false);
            onSaved?.(updatedTab);
        } catch {
            setError("Could not save content. Please try again.");
        } finally {
            setSaving(false);
        }
    }, [editor, saving, isDirty, tab?.id, onSaved]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            const isSave = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";
            if (isSave) {
                event.preventDefault();
                handleSave();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleSave]);

    const handleDelete = async () => {
        if (!tab) return;
        if (!confirm(`Slet fanen "${tab.title}"?`)) return;
        await deleteTab(tab.id);
        onTabDeleted?.(tab.id);
    };

    if (!tab) {
        return <Alert variant="info" className="mt-2">Select a tab to start editing.</Alert>;
    }

    return (
        <div className="handbook-editor">
            {isDirty && (
                <Alert variant="warning" className="py-2 mb-2 bg-warning-subtle text-warning border-warning-subtle">
                    You have unsaved changes.
                </Alert>
            )}

            {error && (
                <Alert variant="danger" className="py-2 mb-2">
                    {error}
                </Alert>
            )}

            <HandbookToolbar editor={editor} />

            {/* Shifted wrapper to dark borders and deep dark background matching system styles */}
            <div className="border border-secondary-subtle rounded bg-dark-subtle text-light mt-2">
                <EditorContent editor={editor} />
            </div>

            <div className="d-flex justify-content-between mt-2">
                <Button variant="outline-danger" onClick={handleDelete}>
                    Slet fane
                </Button>

                <Button variant="primary" onClick={handleSave} disabled={saving || !isDirty}>
                    {saving ? <Spinner animation="border" size="sm" /> : "Save"}
                </Button>
            </div>
        </div>
    );
}

export default HandbookEditor;