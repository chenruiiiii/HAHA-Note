import React from 'react';
import RepoDetailHome from '@/components/layout/Repository/components/RepoDetailHome';
import { repoDetailMock } from '@/components/layout/Repository/data';

const FileHome = () => {
  return <RepoDetailHome {...repoDetailMock} />;
};

export default FileHome;
