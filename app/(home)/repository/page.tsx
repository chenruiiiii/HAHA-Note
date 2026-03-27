import MainContent from '@/components/layout/MainContent';
import Repository from '@/components/layout/Repository';
import HATitle from '@/components/layout/Start/components/HATitle';
import React from 'react';

function RepositoryPage() {
  return (
    <MainContent>
      <HATitle title="知识库" />
      <div className="box">
        <Repository></Repository>
      </div>
    </MainContent>
  );
}

export default RepositoryPage;
