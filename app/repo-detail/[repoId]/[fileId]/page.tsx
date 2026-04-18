'use client';
import HAEditor from '@/components/common/HAEditor';
import { Suspense } from 'react';
import HALoading from '@/components/common/HALoading';
import { useParams } from 'next/navigation';
import HAEmpty from '@/components/common/HAEmpty';
import useDocsDetail from '@/hooks/layer/useDocsDetail';
import { updateDocsDetailData } from '@/services/docs-detail';

const FileDetail = () => {
  const params = useParams();
  const docsId = params.fileId as string;
  const { data, isLoading, error } = useDocsDetail(docsId);

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
          onSave={async ({ title, content }) => {
            await updateDocsDetailData(docsId, {
              title,
              content_html: content,
            });
          }}
        ></HAEditor>
      </div>
    </Suspense>
  );
};

export default FileDetail;
