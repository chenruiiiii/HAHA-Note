'use client';
import SideBar from '@/components/layout/components/SideBar';
import { Layout, theme } from 'antd';
import React, { useState } from 'react';

const { Header, Content, Sider: Aside } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Aside
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{ flex: '0 0 320px', maxWidth: '320px', minWidth: '320px', width: '320px' }}
      >
        <SideBar></SideBar>
      </Aside>
      <Layout>
        {/* <Header style={{ padding: 0, background: colorBgContainer }} /> */}
        <Content style={{ margin: '0 16px' }}></Content>
      </Layout>
    </Layout>
  );
};

export default App;
