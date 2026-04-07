import React, { useEffect, useState } from 'react';
import styles from './style.module.scss';
import { Button, Space, Tooltip } from 'antd';
import HABack from '@/components/common/HABack';
import HACollect from '@/components/common/HACollect';
import { setTempValueAction } from '@/store/modules/temp';
import { useAppDispatch } from '@/store';
import ChatListModal from '@/components/layout/ChatListModal';
import { useRouter } from 'next/navigation';
interface InnerHeaderProps {
  title: string;
}

const InnerHeader = ({ title }: InnerHeaderProps) => {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // 对话列表模态框展示
  const handleOpenModal = () => {
    setOpen((prev) => !prev);
  };
  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    return () => {
      // 组件销毁前清除temp信息
      dispatch(setTempValueAction(''));
    };
  }, []);
  return (
    <div className={[styles['inner-header'], 'f-sb'].join(' ')}>
      <div className="f-left">
        <Space>
          <div className={styles['opt-btn']} onClick={handleOpenModal}>
            <Tooltip title="任务列表">
              <i className="iconfont icon--_renwuliebiao cursor-pointer"></i>
            </Tooltip>
          </div>
          <div className={styles['opt-btn']}>
            <Tooltip title="新对话">
              <i className="iconfont icon-tianjia1 cursor-pointer"></i>
            </Tooltip>
          </div>
          <span className={styles.space}>|</span>
          <HABack onClick={handleBack}>
            <div className={styles['folder-title']}>{title}</div>
          </HABack>
        </Space>
      </div>
      <div className="f-right">
        <Space size={20}>
          <HACollect isCollect={false}></HACollect>
          <Button
            type="primary"
            className={[styles.share, 'cursor-pointer', 'transition-all'].join(' ')}
          >
            <i className="iconfont icon-zhuanfa"></i>分享
          </Button>
        </Space>
      </div>
      {open && <ChatListModal />}
    </div>
  );
};

export default InnerHeader;
