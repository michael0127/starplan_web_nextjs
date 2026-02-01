'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback } from 'react';
import styles from './RichTextEditor.module.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Start typing...',
  className = '',
  error = false
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: styles.editorContent,
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const setHeading = useCallback((level: 2 | 3) => {
    editor?.chain().focus().toggleHeading({ level }).run();
  }, [editor]);

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`${styles.editor} ${error ? styles.editorError : ''} ${className}`}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => setHeading(2)}
            className={`${styles.toolbarBtn} ${editor.isActive('heading', { level: 2 }) ? styles.active : ''}`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => setHeading(3)}
            className={`${styles.toolbarBtn} ${editor.isActive('heading', { level: 3 }) ? styles.active : ''}`}
            title="Heading 3"
          >
            H3
          </button>
        </div>
        
        <div className={styles.toolbarDivider} />
        
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={toggleBold}
            className={`${styles.toolbarBtn} ${editor.isActive('bold') ? styles.active : ''}`}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={toggleItalic}
            className={`${styles.toolbarBtn} ${editor.isActive('italic') ? styles.active : ''}`}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
        </div>
        
        <div className={styles.toolbarDivider} />
        
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={toggleBulletList}
            className={`${styles.toolbarBtn} ${editor.isActive('bulletList') ? styles.active : ''}`}
            title="Bullet List"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <circle cx="4" cy="6" r="1.5" fill="currentColor" />
              <circle cx="4" cy="12" r="1.5" fill="currentColor" />
              <circle cx="4" cy="18" r="1.5" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            onClick={toggleOrderedList}
            className={`${styles.toolbarBtn} ${editor.isActive('orderedList') ? styles.active : ''}`}
            title="Numbered List"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="10" y1="6" x2="21" y2="6" />
              <line x1="10" y1="12" x2="21" y2="12" />
              <line x1="10" y1="18" x2="21" y2="18" />
              <text x="2" y="8" fontSize="8" fill="currentColor" stroke="none">1</text>
              <text x="2" y="14" fontSize="8" fill="currentColor" stroke="none">2</text>
              <text x="2" y="20" fontSize="8" fill="currentColor" stroke="none">3</text>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Editor Content */}
      <EditorContent editor={editor} className={styles.editorWrapper} />
    </div>
  );
}

// Helper to strip HTML for character counting
export function getPlainTextLength(html: string): number {
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').length;
  }
  return html.replace(/<[^>]*>/g, '').length;
}
