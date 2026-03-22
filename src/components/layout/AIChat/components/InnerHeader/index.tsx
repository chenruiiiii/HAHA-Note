import React from 'react';
import './style.scss';
import { Button, Space, Tooltip } from 'antd';
import HABack from '@/components/common/HABack';
import HACollect from '@/components/common/HACollect';
interface InnerHeaderProps {
  title: string;
}

const InnerHeader = ({ title }: InnerHeaderProps) => {
  return (
    <div className="inner-header f-sb">
      <div className="f-left">
        <Space>
          <div className="opt-btn">
            <Tooltip title="任务列表">
              <i className="iconfont icon--_renwuliebiao cursor-pointer"></i>
            </Tooltip>
          </div>
          <div className="opt-btn">
            <Tooltip title="新对话">
              <i className="iconfont icon-tianjia1 cursor-pointer"></i>
            </Tooltip>
          </div>
          <span className="space">|</span>
          <HABack></HABack>
          <div className="folder-title">{title}</div>
        </Space>
      </div>
      <div className="f-right">
        <Space>
          <HACollect isCollect={false}></HACollect>
          <Button type="primary" className="cursor-pointer share transition-all">
            <i className="iconfont icon-zhuanfa"></i>分享
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default InnerHeader;
