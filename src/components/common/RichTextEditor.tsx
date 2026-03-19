import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Heading2,
  Quote,
  Minus,
  Undo,
  Redo,
  Code,
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange?: (html: string) => void
  placeholder?: string
  editable?: boolean
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        flex h-7 w-7 items-center justify-center rounded transition-colors
        ${active ? 'bg-accent/20 text-accent-hover' : 'text-text-tertiary hover:bg-surface-3 hover:text-text-primary'}
        ${disabled ? 'cursor-not-allowed opacity-30' : ''}
      `}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="mx-0.5 h-4 w-px bg-border-subtle" />
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = useCallback(() => {
    const previous = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previous)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const iconSize = 14

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border-subtle px-2 py-1.5">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
      >
        <Bold size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
      >
        <Italic size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline"
      >
        <UnderlineIcon size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        title="Inline Code"
      >
        <Code size={iconSize} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading"
      >
        <Heading2 size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Divider"
      >
        <Minus size={iconSize} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={setLink}
        active={editor.isActive('link')}
        title="Link"
      >
        <LinkIcon size={iconSize} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo size={iconSize} />
      </ToolbarButton>
    </div>
  )
}

export function RichTextEditor({ content, onChange, placeholder, editable = true }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: !editable,
        HTMLAttributes: { class: 'tiptap-link', rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({ placeholder: placeholder ?? 'Add a description...' }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  })

  // Sync editable prop
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  if (!editor) return null

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-2 transition-colors focus-within:border-accent/50">
      {editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}

export function RichTextViewer({ content }: { content: string }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: { class: 'tiptap-link', rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: 'tiptap-viewer',
      },
    },
  })

  if (!editor) return null

  return <EditorContent editor={editor} />
}
