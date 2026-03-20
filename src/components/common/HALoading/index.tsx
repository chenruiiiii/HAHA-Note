import React from 'react';
import './style.scss';
import { Spin } from 'antd';

function HALoading() {
  return (
    <div className="ha-loading">
      <Spin size="large" />
    </div>
  );
}

export default HALoading;
