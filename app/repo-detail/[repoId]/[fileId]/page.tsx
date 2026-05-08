'use client';

import HAEditor from '@/components/common/HAEditor';
import HALoading from '@/components/common/HALoading';
import useDocsDetail from '@/hooks/layer/useDocsDetail';
import { generateDocsSummary } from '@/services/docs-summary';
import { updateDocsDetailData } from '@/services/docs-detail';
import { useAppDispatch } from '@/store';
import { upsertRepoDetailDocAction } from '@/store/modules/repoDetail';
import { DocumentDetail } from '@/models/docs';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.scss';

const FileDetail = () => {
  const params = useParams();
  const dispatch = useAppDispatch();
  const repoId = params.repoId as string;
  const docsId = params.fileId as string;
  const { data, isLoading } = useDocsDetail(docsId, repoId);
  const editorData: DocumentDetail = data ?? {
    _id: docsId,
    repository_id: repoId,
    title: '新建文档',
    content_html: '',
    summary: '',
    author: '',
    updated_at: '',
  };
  const [summary, setSummary] = useState(editorData.summary || '');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [isSummaryDirty, setIsSummaryDirty] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [summaryOverflowing, setSummaryOverflowing] = useState(false);
  const summaryTextRef = useRef<HTMLParagraphElement | null>(null);
  const titleRef = useRef(editorData.title);
  const contentRef = useRef(editorData.content_html);
  const summaryRef = useRef(editorData.summary || '');
  const repositoryIdRef = useRef(editorData.repository_id);
  const authorRef = useRef(editorData.author);
  const summaryDirtyRef = useRef(false);
  const hasFlushedSummaryRef = useRef(false);

  const flushSummaryBeforeLeave = useCallback(() => {
    if (hasFlushedSummaryRef.current || !summaryDirtyRef.current || !docsId) {
      return;
    }

    hasFlushedSummaryRef.current = true;
    summaryDirtyRef.current = false;

    void fetch(`/api/docs-summary/${docsId}`, {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: titleRef.current || '新建文档',
        content_html: contentRef.current || '',
        repository_id: repositoryIdRef.current || repoId,
        author: authorRef.current || '当前用户',
        persist: true,
      }),
    });
  }, [docsId, repoId]);

  useEffect(() => {
    if (!repoId || !docsId) return;

    dispatch(
      upsertRepoDetailDocAction({
        repoId,
        docsId,
        docsName: editorData.title || '新建文档',
      })
    );
  }, [dispatch, docsId, editorData.title, repoId]);

  useEffect(() => {
    titleRef.current = editorData.title;
    contentRef.current = editorData.content_html;
    repositoryIdRef.current = editorData.repository_id;
    authorRef.current = editorData.author;
    summaryRef.current = editorData.summary || '';
    setSummary(editorData.summary || '');
    setSummaryError('');
    summaryDirtyRef.current = false;
    hasFlushedSummaryRef.current = false;
    setIsSummaryDirty(false);
    setSummaryExpanded(false);
  }, [
    editorData.author,
    editorData.content_html,
    editorData.repository_id,
    editorData.summary,
    editorData.title,
  ]);

  useEffect(() => {
    const element = summaryTextRef.current;

    if (!element || !summary) {
      setSummaryOverflowing(false);
      return;
    }

    const checkOverflow = () => {
      setSummaryOverflowing(element.scrollWidth > element.clientWidth + 1);
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);

    return () => {
      window.removeEventListener('resize', checkOverflow);
    };
  }, [summary, summaryExpanded]);

  useEffect(() => {
    if (!docsId || !editorData.content_html.trim() || editorData.summary?.trim()) {
      return;
    }

    let cancelled = false;
    const initialTitle = editorData.title || '新建文档';
    const initialContent = editorData.content_html;

    const loadSummary = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError('');

        const response = await generateDocsSummary(docsId, {
          title: editorData.title || '新建文档',
          content_html: editorData.content_html,
          repository_id: editorData.repository_id || repoId,
          author: editorData.author || '当前用户',
          persist: true,
        });

        const nextSummary =
          'summary' in (response.data as object)
            ? (response.data as { summary?: string }).summary || ''
            : (response.data as DocumentDetail).summary || '';

        if (!cancelled) {
          setSummary(nextSummary);
          summaryRef.current = nextSummary;

          const contentChangedSinceRequest =
            titleRef.current !== initialTitle || contentRef.current !== initialContent;

          if (!contentChangedSinceRequest) {
            summaryDirtyRef.current = false;
            setIsSummaryDirty(false);
          }
        }
      } catch (error) {
        console.error('generate docs summary failed', error);

        if (!cancelled) {
          setSummaryError('AI 总结生成失败，请稍后重试');
        }
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      }
    };

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [
    docsId,
    editorData.author,
    editorData.content_html,
    editorData.repository_id,
    editorData.summary,
    editorData.title,
    repoId,
  ]);

  useEffect(() => {
    const handlePageHide = () => {
      flushSummaryBeforeLeave();
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      flushSummaryBeforeLeave();
    };
  }, [flushSummaryBeforeLeave]);

  if (isLoading) {
    return <HALoading type="simple" />;
  }

  return (
    <Suspense fallback={<HALoading type="simple" />}>
      <div className="file-detail" style={{ height: '100%', overflowY: 'scroll' }}>
        <HAEditor
          initialTitle={editorData.title}
          initialContent={editorData.content_html}
          initialSavedAt={editorData.updated_at}
          topContent={
            <section className={styles.summaryCard}>
              <div className={styles.summaryInner}>
                <div className={styles.summaryIcon}>
                  <i className="iconfont icon-aixiezuo"></i>
                </div>
                <div className={styles.summaryContent}>
                  <div className={styles.summaryMeta}>
                    <span className={styles.summaryLabel}>总结摘要</span>
                    {isSummaryDirty && <span className={styles.summaryBadge}>待同步</span>}
                  </div>
                  <div className={styles.summaryBody}>
                    {summaryLoading ? (
                      <div className={styles.summaryLoading}>
                        <HALoading type="simple" />
                      </div>
                    ) : summary ? (
                      <>
                        <p
                          ref={summaryTextRef}
                          className={[
                            styles.summaryText,
                            summaryExpanded ? styles.summaryTextExpanded : '',
                          ].join(' ')}
                        >
                          {summary}
                        </p>
                        {(summaryOverflowing || summaryExpanded) && (
                          <button
                            type="button"
                            className={styles.summaryToggle}
                            onClick={() => setSummaryExpanded((value) => !value)}
                          >
                            {summaryExpanded ? '收起' : '查看更多'}
                          </button>
                        )}
                      </>
                    ) : summaryError ? (
                      <p className={styles.summaryError}>{summaryError}</p>
                    ) : (
                      <p className={styles.summaryEmpty}>
                        暂无总结，编辑后将在离开页面前自动更新。
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          }
          onTitleChange={(title) => {
            titleRef.current = title || '新建文档';
            summaryDirtyRef.current = true;
            setIsSummaryDirty(true);

            dispatch(
              upsertRepoDetailDocAction({
                repoId,
                docsId,
                docsName: title || '新建文档',
              })
            );
          }}
          onChange={(html) => {
            contentRef.current = html;
            summaryDirtyRef.current = true;
            setIsSummaryDirty(true);
          }}
          onSave={async ({ title, content }) => {
            titleRef.current = title;
            contentRef.current = content;

            await updateDocsDetailData(docsId, {
              title: title || '新建文档',
              content_html: content,
              repository_id: repoId,
              author: editorData.author || '当前用户',
              summary: summaryRef.current,
            });

            dispatch(
              upsertRepoDetailDocAction({
                repoId,
                docsId,
                docsName: title || '新建文档',
              })
            );
          }}
        ></HAEditor>
      </div>
    </Suspense>
  );
};

export default FileDetail;
