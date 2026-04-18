'use client';
import 'antd/dist/reset.css';
// 更改ant-design 主题'
import { Layout } from 'antd';
import { ReactNode, useState } from 'react';
import SideBar from '@/components/layout/SideBar';
import { Content } from 'antd/es/layout/layout';
import { Provider } from 'react-redux';
import store from '@/store';

const { Sider: Aside } = Layout;
const aside_style = {
  flex: '0 0 var(--width-sidebar)',
  maxWidth: 'var(--width-sidebar)',
  minWidth: 'var(--width-sidebar)',
  width: 'var(--width-sidebar)',
  height: '99.95vh',
};

function Home({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Provider store={store}>
      <div className="layout">
        <Aside
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          style={aside_style}
        >
          <SideBar></SideBar>
        </Aside>
        <Layout>
          <Content>{children}</Content>
        </Layout>
      </div>
    </Provider>
  );
}

export default Home;
