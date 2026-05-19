import { Button, ButtonGroup } from "react-bootstrap";

function HandbookToolbar({ editor }) {
    if (!editor) return null;

    const addLink = () => {
        const url = prompt("Enter URL");
        if (url) editor.chain().focus().setLink({ href: url }).run();
    };

    return (
        <div className="d-flex flex-wrap gap-1 p-2 border rounded bg-light">
            <ButtonGroup size="sm">
                <Button
                    variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "outline-secondary"}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                    H1
                </Button>
                <Button
                    variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "outline-secondary"}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                    H2
                </Button>
            </ButtonGroup>

            <ButtonGroup size="sm">
                <Button
                    variant={editor.isActive("bold") ? "secondary" : "outline-secondary"}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <strong>B</strong>
                </Button>
                <Button
                    variant={editor.isActive("italic") ? "secondary" : "outline-secondary"}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <em>I</em>
                </Button>
                <Button
                    variant={editor.isActive("underline") ? "secondary" : "outline-secondary"}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    <u>U</u>
                </Button>
            </ButtonGroup>

            <ButtonGroup size="sm">
                <Button
                    variant={editor.isActive("bulletList") ? "secondary" : "outline-secondary"}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    List
                </Button>
                <Button
                    variant={editor.isActive("orderedList") ? "secondary" : "outline-secondary"}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    1. List
                </Button>
            </ButtonGroup>

            <ButtonGroup size="sm">
                <Button
                    variant={editor.isActive("link") ? "secondary" : "outline-secondary"}
                    onClick={addLink}
                >
                    Link
                </Button>
                <Button
                    variant="outline-secondary"
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
                >
                    Table
                </Button>
                <Button
                    variant="outline-secondary"
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                >
                    ─
                </Button>
            </ButtonGroup>
        </div>
    );
}

export default HandbookToolbar;