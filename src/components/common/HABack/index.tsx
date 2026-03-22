'use client';
import { useRouter } from 'next/navigation';
import './style.scss';
import { Tooltip } from 'antd';

const HABack = () => {
  const router = useRouter();
  return (
    <div className="ha-back" onClick={() => router.push('/ai-chat-home')}>
      <Tooltip title="返回">
        <i className="iconfont icon-arrow-left-double-line cursor-pointer"></i>
      </Tooltip>
    </div>
  );
};

export default HABack;
