'use client';

import './style.scss';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
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
import { getBudget, rateMetric, trackPerformance } from '@/lib/performance';

type SaveReason = 'manual' | 'auto';

type HAEditorProps = {
  initialTitle?: string;
  initialContent?: string;
  initialSavedAt?: string;
  readonly?: boolean;
  showToolbar?: boolean;
  showHeader?: boolean;
  showOutline?: boolean;
  topContent?: ReactNode;
  onTitleChange?: (title: string) => void;
  onTitleSubmit?: (title: string) => void;
  onChange?: (html: string) => void;
  onSave?: (
    payload: { title: string; content: string },
    options: { reason: SaveReason }
  ) => Promise<void> | void;
};

function now() {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}

const HAEditor = ({
  initialTitle = '',
  initialContent = DEFAULT_CONTENT,
  initialSavedAt,
  readonly = false,
  showToolbar = true,
  showHeader = true,
  showOutline = true,
  topContent,
  onTitleChange,
  onTitleSubmit,
  onChange,
  onSave,
}: HAEditorProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [outlineItems, setOutlineItems] = useState<HAEditorOutlineItem[]>([]);
  const [saveStatusText, setSaveStatusText] = useState(getInitialSaveStatusText(initialSavedAt));
  const titleRef = useRef(initialTitle);
  const onSaveRef = useRef(onSave);
  const onChangeRef = useRef(onChange);
  const onTitleChangeRef = useRef(onTitleChange);
  const onTitleSubmitRef = useRef(onTitleSubmit);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSaveRef = useRef<(reason: SaveReason) => Promise<void>>(async () => {});
  const editVersionRef = useRef(0);
  const savedVersionRef = useRef(0);
  const pendingManualSaveRef = useRef(false);
  const pendingAutoSaveRef = useRef(false);
  const isSavingRef = useRef(false);
  const isMountedRef = useRef(true);

  const clearAutosaveTimer = useCallback(() => {
    if (!autosaveTimerRef.current) return;
    clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = null;
  }, []);

  const scheduleAutosave = useCallback(() => {
    clearAutosaveTimer();
    autosaveTimerRef.current = setTimeout(() => {
      autosaveTimerRef.current = null;
      void handleSaveRef.current('auto');
    }, 3000);
  }, [clearAutosaveTimer]);

  const editorMountStartedAtRef = useRef(now());
  const hasReportedEditorReadyRef = useRef(false);

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
      editVersionRef.current += 1;
      setOutlineItems(getOutlineFromEditor(currentEditor.getJSON()));
      setSaveStatusText('编辑中...');
      scheduleAutosave();
      onChangeRef.current?.(html);
    },
  });

  const handleSave = useCallback(
    async (reason: SaveReason) => {
      if (!editor) return;

      if (isSavingRef.current) {
        if (reason === 'manual') {
          pendingManualSaveRef.current = true;
        } else {
          pendingAutoSaveRef.current = true;
        }
        return;
      }

      if (reason === 'auto' && editVersionRef.current === savedVersionRef.current) {
        return;
      }

      clearAutosaveTimer();
      isSavingRef.current = true;

      const versionAtStart = editVersionRef.current;
      const html = injectHeadingIds(editor.getHTML());
      const saveStartedAt = now();

      try {
        await onSaveRef.current?.(
          {
            title: titleRef.current.trim() || '新建文档',
            content: html,
          },
          { reason }
        );

        savedVersionRef.current = Math.max(savedVersionRef.current, versionAtStart);

        const duration = Math.round(now() - saveStartedAt);
        trackPerformance('note_save_completed', {
          metric_name: 'save_note_ms',
          duration_ms: duration,
          value: duration,
          rating: rateMetric(duration, getBudget('save_note_ms')),
          success: true,
        });

        if (editVersionRef.current > versionAtStart) {
          if (isMountedRef.current) {
            setSaveStatusText('编辑中...');
          }
          scheduleAutosave();
        } else if (isMountedRef.current) {
          setSaveStatusText(getSaveStatusText());
        }
      } catch {
        const duration = Math.round(now() - saveStartedAt);
        trackPerformance('note_save_completed', {
          metric_name: 'save_note_ms',
          duration_ms: duration,
          value: duration,
          rating: rateMetric(duration, getBudget('save_note_ms')),
          success: false,
          error_type: 'save_error',
        });

        if (isMountedRef.current) {
          setSaveStatusText('保存失败');
        }
      } finally {
        isSavingRef.current = false;

        if (pendingManualSaveRef.current) {
          pendingManualSaveRef.current = false;
          pendingAutoSaveRef.current = false;
          void handleSaveRef.current('manual');
        } else if (pendingAutoSaveRef.current) {
          pendingAutoSaveRef.current = false;
          void handleSaveRef.current('auto');
        }
      }
    },
    [clearAutosaveTimer, editor, scheduleAutosave]
  );

  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onTitleChangeRef.current = onTitleChange;
  }, [onTitleChange]);

  useEffect(() => {
    onTitleSubmitRef.current = onTitleSubmit;
  }, [onTitleSubmit]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readonly);
  }, [editor, readonly]);

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(injectHeadingIds(initialContent), { emitUpdate: false });
    queueMicrotask(() => {
      if (!isMountedRef.current) return;
      setOutlineItems(getOutlineFromEditor(editor.getJSON()));
    });
  }, [editor, initialContent]);

  useEffect(() => {
    titleRef.current = initialTitle;
    queueMicrotask(() => {
      if (!isMountedRef.current) return;
      setTitle(initialTitle);
    });
  }, [initialTitle]);

  useEffect(() => {
    queueMicrotask(() => {
      if (!isMountedRef.current) return;
      setSaveStatusText(getInitialSaveStatusText(initialSavedAt));
    });
  }, [initialSavedAt]);

  useEffect(() => {
    if (!editor) return;
    if (!hasReportedEditorReadyRef.current) {
      const duration = Math.round(now() - editorMountStartedAtRef.current);
      hasReportedEditorReadyRef.current = true;

      trackPerformance('editor_ready', {
        metric_name: 'editor_ready_ms',
        duration_ms: duration,
        value: duration,
        rating: rateMetric(duration, getBudget('editor_ready_ms')),
        success: true,
      });
    }

    queueMicrotask(() => {
      if (!isMountedRef.current) return;
      setOutlineItems(getOutlineFromEditor(editor.getJSON()));
    });
  }, [editor]);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return;

      event.preventDefault();
      await handleSave('manual');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      clearAutosaveTimer();
    };
  }, [clearAutosaveTimer]);

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
      {showHeader && (
        <EditorHeader
          title={title}
          titlePlaceholder="请输入标题"
          saveStatusText={saveStatusText}
          onTitleChange={(nextTitle) => {
            const normalizedTitle = nextTitle.slice(0, MAX_TITLE_LENGTH);
            editVersionRef.current += 1;
            setTitle(normalizedTitle);
            titleRef.current = normalizedTitle;
            setSaveStatusText('编辑中...');
            scheduleAutosave();
            onTitleChangeRef.current?.(normalizedTitle);
          }}
          onTitleSubmit={(nextTitle) => {
            const normalizedTitle = nextTitle.trim().slice(0, MAX_TITLE_LENGTH);
            setTitle(normalizedTitle);
            titleRef.current = normalizedTitle;
            onTitleSubmitRef.current?.(normalizedTitle);
            scheduleAutosave();
          }}
        />
      )}

      {showToolbar && editor && (
        <EditorToolbar editor={editor} title={title} onSave={() => handleSave('manual')} />
      )}

      <div className="ha-editor-shell">
        <main className="ha-editor-main">
          {topContent && <div className="ha-editor-top-content">{topContent}</div>}
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
