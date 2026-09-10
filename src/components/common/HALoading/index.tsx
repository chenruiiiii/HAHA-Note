import React from 'react';
import './style.scss';
import { Spin } from 'antd';

interface HALoadingProps {
  type: 'simple' | 'ai';
  /**
   * 填充方式：
   * - `container`（默认）填满父容器，适用于内容区/覆盖层内的局部 loading；
   * - `viewport` 至少占满视口高度，适用于登录页这类整页 loading。
   */
  fill?: 'container' | 'viewport';
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

function HALoading({ type, fill = 'container' }: HALoadingProps) {
  const className = fill === 'viewport' ? 'ha-loading ha-loading--viewport' : 'ha-loading';

  return <div className={className}>{handleLoadingType(type)}</div>;
}

export default HALoading;
