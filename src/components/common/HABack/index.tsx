'use client';
import { useRouter } from 'next/navigation';
import './style.scss';
import { Tooltip } from 'antd';
import { ReactNode } from 'react';

interface HABackProps {
  children: ReactNode;
  onClick?: () => void;
}

const HABack = ({ children, onClick }: HABackProps) => {
  // const router = useRouter();

  return (
    <Tooltip title="返回">
      <div className="ha-back cursor-pointer" onClick={() => onClick?.()}>
        <i className="iconfont icon-arrow-left-double-line cursor-pointer"></i>
        <span className="back-node">{children}</span>
      </div>
    </Tooltip>
  );
};

export default HABack;
