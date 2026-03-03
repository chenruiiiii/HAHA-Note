import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import '@/assets/styles/global.css';

const RootLayout = ({ children }: React.PropsWithChildren) => (
  <html lang="en">
    <body>
      <AntdRegistry>{children}</AntdRegistry>
    </body>
  </html>
);

export default RootLayout;