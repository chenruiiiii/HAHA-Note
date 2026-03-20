'use client';
import 'antd/dist/reset.css';
import '@/assets/styles/var.scss';
import '@/assets/styles/global.scss';
import '@/assets/iconfont/index.css';
import '@/assets/styles/index.scss'; // 必须在reset.css之后引入
// 更改ant-design 主题'
import { Layout } from 'antd';
import { ReactNode, useState } from 'react';
import SideBar from '@/components/layout/SideBar';

const { Sider: Aside } = Layout;
const aside_style = {
  flex: '0 0 var(--width-sidebar)',
  maxWidth: 'var(--width-sidebar)',
  minWidth: 'var(--width-sidebar)',
  width: 'var(--width-sidebar)',
};

function Home({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Aside
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={aside_style}
      >
        <SideBar></SideBar>
      </Aside>
      <Layout>{children}</Layout>
    </Layout>
  );
}

export default Home;
