import '@/assets/iconfont/index.css';
import '@/assets/styles/global.scss';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import React from 'react';

const RootLayout = ({ children }: React.PropsWithChildren) => (
  <html lang="en">
    <body>
      <AntdRegistry>{children}</AntdRegistry>
    </body>
  </html>
);

export default RootLayout;