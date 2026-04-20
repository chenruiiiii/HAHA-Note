'use client';

import './style.scss';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  getInitialSaveStatusText,
  getOutlineFromEditor,
  getSaveStatusText,
  injectHeadingIds,
} from '../../../utils/editor';
import { debounce } from '@/utils/debounce';

type HAEditorProps = {
  initialTitle?: string;
  initialContent?: string;
  initialSavedAt?: string;
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
  initialSavedAt,
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
  const [saveStatusText, setSaveStatusText] = useState(getInitialSaveStatusText(initialSavedAt));
  const [messageApi, contextHolder] = message.useMessage();
  const titleRef = useRef(initialTitle);
  const onSaveRef = useRef(onSave);
  const autoSaveRef = useRef<() => Promise<void>>(async () => {});
  const debouncedAutoSaveRef = useRef<ReturnType<typeof debounce<() => void>> | null>(null);

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
      setSaveStatusText('编辑中...');
      onChange?.(html);
      debouncedAutoSaveRef.current?.();
    },
  });

  const handleSave = useCallback(async () => {
    if (!editor) return;
    const html = injectHeadingIds(editor.getHTML());

    try {
      await onSaveRef.current?.({
        title: titleRef.current.trim() || '新建文档',
        content: html,
      });

      setSaveStatusText(getSaveStatusText());
    } catch {
      messageApi.error('保存失败，请稍后重试');
    }
  }, [editor, messageApi]);

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
    titleRef.current = initialTitle;
  }, [initialTitle]);

  useEffect(() => {
    setSaveStatusText(getInitialSaveStatusText(initialSavedAt));
  }, [initialSavedAt]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    autoSaveRef.current = handleSave;
  }, [handleSave]);

  useEffect(() => {
    const debouncedAutoSave = debounce(() => {
      void autoSaveRef.current();
    }, 1000);

    debouncedAutoSaveRef.current = debouncedAutoSave;

    return () => {
      debouncedAutoSave.cancel();
      debouncedAutoSaveRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!editor) return;
    setOutlineItems(getOutlineFromEditor(editor.getJSON()));
  }, [editor]);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return;

      event.preventDefault();
      await handleSave();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

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
            titleRef.current = normalizedTitle;
            setSaveStatusText('编辑中...');
            onTitleChange?.(normalizedTitle);
            debouncedAutoSaveRef.current?.();
          }}
          onTitleSubmit={async (nextTitle) => {
            const normalizedTitle = nextTitle.trim().slice(0, MAX_TITLE_LENGTH);
            setTitle(normalizedTitle);
            titleRef.current = normalizedTitle;
            onTitleSubmit?.(normalizedTitle);
            await handleSave();
          }}
        />
      )}

      {showToolbar && editor && <EditorToolbar editor={editor} title={title} onSave={handleSave} />}

      <div className="ha-editor-shell">
        <main className="ha-editor-main">
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
