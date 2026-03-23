import React from 'react';
import './style.scss';
import { Spin } from 'antd';

interface HALoadingProps {
  type: 'simple' | 'ai';
}

const handleLoadingType = (type: string) => {
  switch (type) {
    case 'simple': //简单加载
      return <Spin size="large" />;
    case 'ai': // ai 打字机效果前加载
      return (
        <div className='ha-loading-ai'>
          <i className="iconfont icon-aixiezuo"></i>
        </div>
      );
    default:
      return <Spin size="large" />;
  }
};

function HALoading({ type }: HALoadingProps) {
  return <div className="ha-loading">{handleLoadingType(type)}</div>;
}

export default HALoading;
