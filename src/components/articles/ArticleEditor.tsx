import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Undo, Redo, Link as LinkIcon, Image as ImageIcon, Minus } from "lucide-react";
import { useCallback, useEffect } from "react";

interface ArticleEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

export function ArticleEditor({ content, onChange, placeholder = "Tulis artikel di sini..." }: ArticleEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: "rounded-lg max-w-full",
                },
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
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-lg dark:prose-invert max-w-none min-h-[400px] focus:outline-none p-4",
            },
        },
    });

    // Sync external content changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    const addImage = useCallback(() => {
        const url = window.prompt("Enter image URL:");
        if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    const setLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("Enter URL:", previousUrl);

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
        <div className="border rounded-lg overflow-hidden bg-background">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
                {/* Text Formatting */}
                <Toggle size="sm" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()}>
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()}>
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive("strike")} onPressedChange={() => editor.chain().focus().toggleStrike().run()}>
                    <Strikethrough className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive("code")} onPressedChange={() => editor.chain().focus().toggleCode().run()}>
                    <Code className="h-4 w-4" />
                </Toggle>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Headings */}
                <Toggle size="sm" pressed={editor.isActive("heading", { level: 1 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                    <Heading1 className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive("heading", { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                    <Heading2 className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive("heading", { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                    <Heading3 className="h-4 w-4" />
                </Toggle>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Lists */}
                <Toggle size="sm" pressed={editor.isActive("bulletList")} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}>
                    <List className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive("orderedList")} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}>
                    <ListOrdered className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive("blockquote")} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}>
                    <Quote className="h-4 w-4" />
                </Toggle>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Insert */}
                <Button variant="ghost" size="sm" onClick={setLink}>
                    <LinkIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={addImage}>
                    <ImageIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                    <Minus className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* History */}
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                    <Undo className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                    <Redo className="h-4 w-4" />
                </Button>
            </div>

            {/* Editor Content */}
            <EditorContent className="bg-white" editor={editor} />
        </div>
    );
}
