"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Heading2, Heading3, Undo, Redo, Minus,
} from "lucide-react"

function ToolbarButton({ onClick, active, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${active ? "bg-gray-200 text-unamad" : "text-gray-600"}`}
    >
      {children}
    </button>
  )
}

export function TiptapEditor({ content, onChange, name = "content" }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Escribe el contenido del temario...",
      }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[120px] px-3 py-2 outline-none focus:outline-none",
      },
    },
  })

  if (!editor) return null

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={editor.getHTML()} />

      <div className="rounded-md border border-input overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-gray-50">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Negrita"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Cursiva"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Subrayado"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Titulo"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Subtitulo"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Lista"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Separador"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>

          <div className="flex-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Deshacer"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Rehacer"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
