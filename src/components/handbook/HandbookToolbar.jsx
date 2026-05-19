import { useState } from "react";
import { Button, ButtonGroup, Modal, Form } from "react-bootstrap";

function HandbookToolbar({ editor }) {
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");

    if (!editor) return null;

    const openLinkModal = () => {
        const previousUrl = editor.getAttributes("link").href || "";
        setLinkUrl(previousUrl);
        setShowLinkModal(true);
    };

    const saveLink = () => {
        if (!linkUrl.trim()) {
            editor.chain().focus().unsetLink().run();
        } else {
            editor.chain().focus().setLink({ href: linkUrl }).run();
        }
        setShowLinkModal(false);
    };

    return (
        <>
            {/* Added styling to matching toolbar block container layout */}
            <div className="d-flex flex-wrap gap-2 p-2 border border-secondary-subtle rounded bg-dark text-light">
                <ButtonGroup size="sm">
                    <Button
                        variant={editor.isActive("heading", { level: 1 }) ? "light" : "outline-light"}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    >
                        H1
                    </Button>
                    <Button
                        variant={editor.isActive("heading", { level: 2 }) ? "light" : "outline-light"}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    >
                        H2
                    </Button>
                </ButtonGroup>

                <ButtonGroup size="sm">
                    <Button
                        variant={editor.isActive("bold") ? "light" : "outline-light"}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                        <strong>B</strong>
                    </Button>
                    <Button
                        variant={editor.isActive("italic") ? "light" : "outline-light"}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                        <em>I</em>
                    </Button>
                    <Button
                        variant={editor.isActive("underline") ? "light" : "outline-light"}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                    >
                        <u>U</u>
                    </Button>
                </ButtonGroup>

                <ButtonGroup size="sm">
                    <Button
                        variant={editor.isActive("bulletList") ? "light" : "outline-light"}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                    >
                        • List
                    </Button>
                    <Button
                        variant={editor.isActive("orderedList") ? "light" : "outline-light"}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                        1. List
                    </Button>
                    <Button
                        variant={editor.isActive("taskList") ? "light" : "outline-light"}
                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                    >
                        ☑ List
                    </Button>
                </ButtonGroup>

                <ButtonGroup size="sm">
                    <Button
                        variant={editor.isActive("link") ? "light" : "outline-light"}
                        onClick={openLinkModal}
                    >
                        Link
                    </Button>
                </ButtonGroup>

                <ButtonGroup size="sm">
                    <Button
                        variant="outline-light"
                        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    >
                        Table
                    </Button>
                    <Button
                        variant="outline-light"
                        disabled={!editor.isActive("table")}
                        onClick={() => editor.chain().focus().addColumnAfter().run()}
                    >
                        + Col
                    </Button>
                    <Button
                        variant="outline-light"
                        disabled={!editor.isActive("table")}
                        onClick={() => editor.chain().focus().deleteColumn().run()}
                    >
                        - Col
                    </Button>
                    <Button
                        variant="outline-light"
                        disabled={!editor.isActive("table")}
                        onClick={() => editor.chain().focus().addRowAfter().run()}
                    >
                        + Row
                    </Button>
                    <Button
                        variant="outline-light"
                        disabled={!editor.isActive("table")}
                        onClick={() => editor.chain().focus().deleteRow().run()}
                    >
                        - Row
                    </Button>
                </ButtonGroup>

                <ButtonGroup size="sm" className="ms-auto">
                    <Button
                        variant="outline-light"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                    >
                        Undo
                    </Button>
                    <Button
                        variant="outline-light"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                    >
                        Redo
                    </Button>
                </ButtonGroup>
            </div>

            <Modal show={showLinkModal} onHide={() => setShowLinkModal(false)} centered contentClassName="bg-dark text-light border-secondary">
                <Modal.Header closeButton closeVariant="white">
                    <Modal.Title>Edit Link</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>URL</Form.Label>
                        <Form.Control
                            type="url"
                            className="bg-secondary text-white border-secondary"
                            placeholder="https://example.com"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-light" onClick={() => setShowLinkModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={() => { editor.chain().focus().unsetLink().run(); setShowLinkModal(false); }}>Remove</Button>
                    <Button variant="primary" onClick={saveLink}>Save</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default HandbookToolbar;