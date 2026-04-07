'use client';
import HAEditor from '@/components/common/HAEditor';
import { Suspense } from 'react';
import HALoading from '@/components/common/HALoading';
import { useParams } from 'next/navigation';

interface FileDetailProps {
  id: string;
}

const FileDetail = () => {
  const params = useParams();
  return (
    <Suspense fallback={<HALoading type="simple" />}>
      <div className="file-detail">
        <HAEditor></HAEditor>
      </div>
    </Suspense>
  );
};

export default FileDetail;
