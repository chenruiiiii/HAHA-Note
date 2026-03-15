'use client';
import SideBar from '@/components/layout/components/SideBar';
import { Layout } from 'antd';
import React, { useState } from 'react';

const {Content, Sider: Aside } = Layout;
const aside_style = {
  flex: '0 0 var(--width-sidebar)',
  maxWidth: 'var(--width-sidebar)',
  minWidth: 'var(--width-sidebar)',
  width: 'var(--width-sidebar)',
}

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Aside
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={ aside_style }
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
