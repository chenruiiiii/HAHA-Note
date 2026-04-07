'use client';
import { Modal } from 'antd';
import { useState } from 'react';
import './style.scss';
import Portal from '@/components/common/Portal';
import NewFileModal from '../NewFileModal';
import NewRepoModal from '../NewRepoModal';

interface FolderItem {
  title: string;
  icon: string;
  type: string;
  color: string;
  description: string;
  drop: boolean;
}

function NewFolderItem({ title, icon, color, description, type }: FolderItem) {
  const [isModalOpen, setIsModalOpen] = useState(false); // 控制新建文件模态框展示
  const [_, setIsShow] = useState(false);
  const handleMenuClick = () => {
    setIsModalOpen(true);
  };

  // 下拉框内容
  const content = (
    <div className="f-jc-s new-folder-item cursor-pointer" onClick={handleMenuClick}>
      <div className="f-left">
        <i className={`iconfont ${icon}`} style={{ color: color || '#aaa' }}></i>
      </div>
      <div className="f-right">
        <div className="desc">
          <div className="top">{title}</div>
          <div className="down">{description}</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {content}
      <Portal>
        <Modal
          title={type === 'note' ? '新建文件' : '新建知识🧀库'}
          cancelText="取消"
          okText="确定"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          style={{
            minWidth: '300px',
          }}
        >
          {type === 'note' && <NewFileModal />}
          {type === 'repo' && <NewRepoModal />}
        </Modal>
      </Portal>
    </>
  );
}

export default NewFolderItem;
