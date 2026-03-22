import React from 'react';
import './style.scss';
import { Divider } from 'antd';

const CaseContainer = () => {
  return (
    <div className="case-container">
      <div className="divider">
        <Divider>
          <span className="divider-name">探索精选案例</span>
        </Divider>
      </div>
      <div className="list"></div>
    </div>
  );
};

export default CaseContainer;
