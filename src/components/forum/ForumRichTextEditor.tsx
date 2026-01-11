import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bold, Italic, List, ListOrdered, Quote, Code, Undo, Redo, Link as LinkIcon } from "lucide-react";
import { useCallback, useEffect } from "react";

interface ForumRichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    disabled?: boolean;
    minHeight?: string;
    className?: string;
}

/**
 * Simplified rich text editor for forum posts and replies.
 * Features: Bold, Italic, Lists, Quotes, Code, Links
 * No headings, images, or horizontal rules (text-focused)
 */
export function ForumRichTextEditor({ content, onChange, placeholder = "Tulis pesan Anda...", disabled = false, minHeight = "150px", className = "" }: ForumRichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false, // Disable headings for forum
                horizontalRule: false, // Disable HR
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-primary underline",
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        editable: !disabled,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: `prose prose-sm dark:prose-invert max-w-none focus:outline-none p-3`,
                style: `min-height: ${minHeight}`,
            },
        },
    });

    // Sync external content changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    // Handle disabled state
    useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    }, [disabled, editor]);

    const setLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("Masukkan URL:", previousUrl);

        if (url === null) return;

        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }, [editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className={`border rounded-lg overflow-hidden bg-background ${className}`}>
            {/* Simplified Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
                {/* Text Formatting */}
                <Toggle size="sm" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()} disabled={disabled} title="Bold (Ctrl+B)">
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()} disabled={disabled} title="Italic (Ctrl+I)">
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive("code")} onPressedChange={() => editor.chain().focus().toggleCode().run()} disabled={disabled} title="Inline Code">
                    <Code className="h-4 w-4" />
                </Toggle>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Lists */}
                <Toggle size="sm" pressed={editor.isActive("bulletList")} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} disabled={disabled} title="Bullet List">
                    <List className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive("orderedList")} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} disabled={disabled} title="Numbered List">
                    <ListOrdered className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive("blockquote")} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()} disabled={disabled} title="Quote">
                    <Quote className="h-4 w-4" />
                </Toggle>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Link */}
                <Button variant="ghost" size="sm" onClick={setLink} disabled={disabled} title="Insert Link">
                    <LinkIcon className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* History */}
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={disabled || !editor.can().undo()} title="Undo (Ctrl+Z)">
                    <Undo className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={disabled || !editor.can().redo()} title="Redo (Ctrl+Y)">
                    <Redo className="h-4 w-4" />
                </Button>
            </div>

            {/* Editor Content */}
            <EditorContent className={`bg-white dark:bg-background ${disabled ? "opacity-50" : ""}`} editor={editor} />
        </div>
    );
}
