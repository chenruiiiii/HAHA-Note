import { Layout } from 'antd';
import RepoSide from '@/components/layout/Repository/components/RepoSide';
import { Content } from 'antd/es/layout/layout';
import Sider from 'antd/es/layout/Sider';
import { RepoDetailType } from '@/components/layout/Repository/types';
import './style.scss';
import { ReactNode } from 'react';
import { repoDetailMock } from '@/components/layout/Repository/data';

const RepoDetail = ({ children }: { children: ReactNode }) => {
  return (
    <div className="repo-detail">
      {/* <Layout style={{display:'flex',flexWrap:'nowrap'}}> */}
      {/* <Sider width={300} theme="light" style={{ maxHeight: '100vh' }}> */}
      <RepoSide {...repoDetailMock} />
      {/* </Sider> */}
      <Content>{children}</Content>
      {/* </Layout> */}
    </div>
  );
};

export default RepoDetail;
