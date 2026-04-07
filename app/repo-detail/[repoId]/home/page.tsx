import React from 'react';
import RepoDetailHome from '@/components/layout/Repository/components/RepoDetailHome';
import { repoDetailMock } from '@/components/layout/Repository/data';
import MainContent from '@/components/layout/MainContent';

const FileHome = () => {
  return (
    <MainContent>
      <RepoDetailHome {...repoDetailMock} />
    </MainContent>
  );
};

export default FileHome;
