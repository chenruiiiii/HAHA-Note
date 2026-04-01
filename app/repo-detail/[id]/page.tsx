import { Layout } from 'antd';
import RepoSide from '@/components/layout/Repository/components/RepoSide';
import { Content } from 'antd/es/layout/layout';
import Sider from 'antd/es/layout/Sider';
import { RepoDetailType } from '@/components/layout/Repository/types';
import './style.scss';

const RepoDetail = () => {
  const repo_info: RepoDetailType = {
    name: 'repo-name',
    isPublic: true,
    description: 'repo-description',
    update_time: '2024-06-01 12:00',
    owner: 'owner',
    avatar: ['https://avatars.githubusercontent.com/u/1024025?v=4'],
    repo_list: [
      {
        name: 'repo-name-1',
        update_time: '2024-06-01 12:00',
      },
    ],
    collect: true,
  };
  return (
    <div className="repo-detail">
      <Layout>
        <Sider width={300} theme="light">
          <RepoSide {...repo_info} />
        </Sider>
        <Layout>
          <Content></Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default RepoDetail;
