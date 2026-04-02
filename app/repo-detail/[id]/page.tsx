'use client';
import HAEditor from '@/components/common/HAEditor';
import { useParams } from 'next/navigation';
import React from 'react';

interface FileDetailProps {
  id: string;
}

const FileDetail = () => {
  const params = useParams();
  return (
    <div className="file-detail">
      <HAEditor></HAEditor>
    </div>
  );
};

export default FileDetail;
