'use client';
import HAEditor from '@/components/common/HAEditor';
import { Suspense, useEffect } from 'react';
import HALoading from '@/components/common/HALoading';
import { useParams } from 'next/navigation';
import useDocsDetail from '@/hooks/layer/useDocsDetail';
import { updateDocsDetailData } from '@/services/docs-detail';
import { useAppDispatch } from '@/store';
import { upsertRepoDetailDocAction } from '@/store/modules/repoDetail';
import { DocumentDetail } from '@/models/docs';

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
    author: '',
    updated_at: '',
  };

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
          onTitleChange={(title) => {
            dispatch(
              upsertRepoDetailDocAction({
                repoId,
                docsId,
                docsName: title || '新建文档',
              })
            );
          }}
          onSave={async ({ title, content }) => {
            await updateDocsDetailData(docsId, {
              title: title || '新建文档',
              content_html: content,
              repository_id: repoId,
              author: editorData.author || '当前用户',
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
