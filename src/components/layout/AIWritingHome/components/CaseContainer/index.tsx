import React from 'react';
import './style.scss';
import { Divider } from 'antd';
import HAVirtualScroll from '@/components/common/HAVirtualScroll';
import CommonCard from '@/components/common/CommonCard';

const CaseContainer = () => {
  return (
    <div className="case-container">
      <div className="divider">
        <Divider>
          <span className="divider-name">探索精选案例</span>
        </Divider>
      </div>
      <div className="list">
        <HAVirtualScroll>
          <CommonCard>
            <div className="img">图片</div>
            <div className="info">
              <div className="title ellipse">春节春节春节春节春节春节春节春节</div>
              <div className="like">
                <i className="iconfont icon-icon"></i>100
              </div>
            </div>
          </CommonCard>
        </HAVirtualScroll>
      </div>
    </div>
  );
};

export default CaseContainer;
