import 'antd/dist/reset.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import '@/assets/styles/var.scss';
import '@/assets/styles/global.scss';
import '@/assets/iconfont/index.css';
import '@/assets/styles/index.scss'; // 必须在reset.css之后引入
import { ConfigProvider } from 'antd';
// 更改ant-design 主题'
import theme_config from '@/assets/styles/theme/theme_config';
import React from 'react';

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <ConfigProvider theme={theme_config}>
            {children}
            <div id="portal-root"></div>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
};

export default RootLayout;
