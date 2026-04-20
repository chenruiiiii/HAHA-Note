'use client';
import HAEditor from '@/components/common/HAEditor';
import { Suspense, useEffect } from 'react';
import HALoading from '@/components/common/HALoading';
import { useParams } from 'next/navigation';
import HAEmpty from '@/components/common/HAEmpty';
import useDocsDetail from '@/hooks/layer/useDocsDetail';
import { updateDocsDetailData } from '@/services/docs-detail';
import { useAppDispatch } from '@/store';
import { upsertRepoDetailDocAction } from '@/store/modules/repoDetail';

const FileDetail = () => {
  const params = useParams();
  const dispatch = useAppDispatch();
  const repoId = params.repoId as string;
  const docsId = params.fileId as string;
  const { data, isLoading, error } = useDocsDetail(docsId, repoId);

  useEffect(() => {
    if (!repoId || !docsId || !data?.title) return;

    dispatch(
      upsertRepoDetailDocAction({
        repoId,
        docsId,
        docsName: data.title,
      })
    );
  }, [data?.title, dispatch, docsId, repoId]);

  if (isLoading) {
    return <HALoading type="simple" />;
  }

  if (error || !data) {
    return <HAEmpty />;
  }

  return (
    <Suspense fallback={<HALoading type="simple" />}>
      <div className="file-detail" style={{ height: '100%', overflowY: 'scroll' }}>
        <HAEditor
          initialTitle={data.title}
          initialContent={data.content_html}
          initialSavedAt={data.updated_at}
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
              author: data.author || '当前用户',
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
