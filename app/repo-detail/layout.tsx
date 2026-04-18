import RepoSide from '@/components/layout/Repository/components/RepoSide';
import { Content } from 'antd/es/layout/layout';
import './style.scss';
import { ReactNode } from 'react';
// import { repoDetailMock } from '@/components/layout/Repository/data';

const RepoDetail = ({ children }: { children: ReactNode }) => {
  return (
    <div className="repo-detail">
      <RepoSide />
      <Content>{children}</Content>
    </div>
  );
};

export default RepoDetail;
