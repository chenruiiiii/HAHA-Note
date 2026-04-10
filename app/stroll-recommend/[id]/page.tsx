import { notFound } from 'next/navigation';
import React from 'react';
import FileDetail from '@/components/layout/Stroll/components/FileDetail';
import { getRecommendDetailById } from '@/components/layout/Stroll/data';

const StrollRecommend = async ({ params: { id } }: { params: { id: string } }) => {
  const detail = await getRecommendDetailById(id);

  if (!detail) {
    notFound();
  }

  return <FileDetail detail={detail} />;
};

export default StrollRecommend;
