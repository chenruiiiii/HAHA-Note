import { Button, Result } from 'antd';
import React, { memo } from 'react';
import type { ReactNode } from 'react';
import './style.scss';

interface IProps {
  children?: ReactNode;
}

const HAError: React.FC<IProps> = () => {
  return (
    <div className="ha-error">
      <Result
        status="500"
        title="500"
        subTitle="服务器繁忙，请稍候再试~"
        style={{ scale: '0.6' }}
        extra={<Button type="primary">回首页</Button>}
      />
    </div>
  );
};

export default memo(HAError);
