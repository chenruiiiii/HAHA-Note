import React from 'react';
import './style.scss';
import { Empty } from 'antd';

const HAEmpty = () => {
  return (
    <div className="ha-empty">
      <Empty description="暂无数据" />
    </div>
  );
};

export default HAEmpty;
