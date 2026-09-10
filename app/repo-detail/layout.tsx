'use client';
import RepoSide from '@/components/layout/Repository/components/RepoSide';
import { Content } from 'antd/es/layout/layout';
import './style.scss';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import store from '@/store';
import { RepoDetailProvider } from '@/components/layout/Repository/context';
// import { repoDetailMock } from '@/components/layout/Repository/data';

const RepoDetail = ({ children }: { children: ReactNode }) => {
  return (
    <Provider store={store}>
      <RepoDetailProvider>
        <div className="repo-detail">
          <RepoSide />
          <Content>{children}</Content>
        </div>
      </RepoDetailProvider>
    </Provider>
  );
};

export default RepoDetail;
