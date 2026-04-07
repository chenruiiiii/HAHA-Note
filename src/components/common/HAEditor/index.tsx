'use client';

import './style.scss';
import React, { useCallback, useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { message } from 'antd';
import EditorHeader from './components/EditorHeader';
import EditorToolbar from './components/EditorToolbar';
import EditorOutline from './components/EditorOutline';
import EditorPreview from './components/EditorPreview';
import {
  DEFAULT_CONTENT,
  HAEditorOutlineItem,
  MAX_TITLE_LENGTH,
  getOutlineFromEditor,
  getSaveStatusText,
  injectHeadingIds,
} from '../../../utils/editor';

type HAEditorProps = {
  initialTitle?: string;
  initialContent?: string;
  readonly?: boolean;
  showToolbar?: boolean;
  showHeader?: boolean;
  showOutline?: boolean;
  onTitleChange?: (title: string) => void;
  onTitleSubmit?: (title: string) => void;
  onChange?: (html: string) => void;
  onSave?: (payload: { title: string; content: string }) => Promise<void> | void;
};

const HAEditor = ({
  initialTitle = '',
  initialContent = DEFAULT_CONTENT,
  readonly = false,
  showToolbar = true,
  showHeader = true,
  showOutline = true,
  onTitleChange,
  onTitleSubmit,
  onChange,
  onSave,
}: HAEditorProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [outlineItems, setOutlineItems] = useState<HAEditorOutlineItem[]>([]);
  const [saveStatusText, setSaveStatusText] = useState('未保存');
  const [isEditorHovered, setIsEditorHovered] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const editor = useEditor({
    extensions: [StarterKit],
    content: injectHeadingIds(initialContent),
    immediatelyRender: false,
    editable: !readonly,
    editorProps: {
      attributes: {
        class: 'ha-editor-prosemirror',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = injectHeadingIds(currentEditor.getHTML());
      setOutlineItems(getOutlineFromEditor(currentEditor.getJSON()));
      onChange?.(html);
    },
  });

  const handleSave = useCallback(async () => {
    if (!editor) return;
    const html = injectHeadingIds(editor.getHTML());

    await onSave?.({
      title: title.trim(),
      content: html,
    });

    setSaveStatusText(getSaveStatusText());
    messageApi.success('已保存');
  }, [editor, messageApi, onSave, title]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readonly);
  }, [editor, readonly]);

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(injectHeadingIds(initialContent), { emitUpdate: false });
    setOutlineItems(getOutlineFromEditor(editor.getJSON()));
  }, [editor, initialContent]);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    if (!editor) return;
    setOutlineItems(getOutlineFromEditor(editor.getJSON()));
  }, [editor]);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return;
      if (!isEditorHovered) return;

      event.preventDefault();
      await handleSave();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, isEditorHovered]);

  if (readonly) {
    return (
      <EditorPreview
        title={title}
        content={injectHeadingIds(initialContent)}
        showOutline={showOutline}
      />
    );
  }

  return (
    <div className="ha-editor">
      {contextHolder}
      {showHeader && (
        <EditorHeader
          title={title}
          titlePlaceholder="请输入标题"
          saveStatusText={saveStatusText}
          onTitleChange={(nextTitle) => {
            const normalizedTitle = nextTitle.slice(0, MAX_TITLE_LENGTH);
            setTitle(normalizedTitle);
            onTitleChange?.(normalizedTitle);
          }}
          onTitleSubmit={(nextTitle) => {
            const normalizedTitle = nextTitle.trim().slice(0, MAX_TITLE_LENGTH);
            setTitle(normalizedTitle);
            onTitleSubmit?.(normalizedTitle);
          }}
        />
      )}

      {showToolbar && editor && <EditorToolbar editor={editor} />}

      <div className="ha-editor-shell">
        <main
          className="ha-editor-main"
          onMouseEnter={() => setIsEditorHovered(true)}
          onMouseLeave={() => setIsEditorHovered(false)}
        >
          <div className="ha-editor-document">
            <div className="ha-editor-page">
              <div className="ha-editor-page-title">{title}</div>
              <EditorContent editor={editor} />
            </div>
          </div>
        </main>

        {showOutline && <EditorOutline items={outlineItems} />}
      </div>
    </div>
  );
};

export { EditorPreview as HAEditorPreview };
export default HAEditor;
