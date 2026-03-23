import React from 'react';
import './style.scss';
import { Space, Tooltip } from 'antd';

interface HACollectProps {
  isCollect: boolean;
}

const HACollect = ({ isCollect }: HACollectProps) => {
  return (
    <div className="ha-collect">
      {isCollect ? (
        <Tooltip title="取消收藏">
          <i className="iconfont icon-shoucang-yishoucang collected"></i>
        </Tooltip>
      ) : (
        <Tooltip title="收藏">
          <i className="iconfont icon-shoucang2 no-collected"></i>
        </Tooltip>
      )}
    </div>
  );
};

export default HACollect;
