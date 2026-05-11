'use client';

import { App as AntdApp } from 'antd';
import { ReactNode, useEffect } from 'react';
import { setMessageApi } from '@/utils/message_reminder';

function AntdMessageProvider({ children }: { children: ReactNode }) {
  const { message } = AntdApp.useApp();

  useEffect(() => {
    setMessageApi(message);
    return () => {
      setMessageApi(null);
    };
  }, [message]);

  return children;
}

export default AntdMessageProvider;
