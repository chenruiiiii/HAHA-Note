'use client';
import { NEW_DOCUMENT_OPTIONS } from '@/constants/config.ts/start';
import type { MenuProps } from 'antd';
import { Dropdown, message, Modal } from 'antd';
import { useState } from 'react';
import './style.scss';
import Portal from '@/components/common/Portal';
import NewFileModal from '../NewFileModal';

interface FolderItem {
  title: string;
  icon: string;
  type: string;
  color: string;
  description: string;
  drop: boolean;
}

function NewFolderItem({ title, icon, color, description, drop }: FolderItem) {
  const [isModalOpen, setIsModalOpen] = useState(false); // 控制新建文件模态框展示
  const [_, setIsShow] = useState(false);
  const handleMenuClick: MenuProps['onClick'] = (e) => {
    console.log('click', e.key);
    switch (e.key) {
      case '1':
        // 新建文件
        setIsModalOpen(true);
        break;
    }
  };
  const menuProps = {
    items: NEW_DOCUMENT_OPTIONS,
    onClick: handleMenuClick,
  };

  // 下拉框内容
  const content = (
    <div
      className="f-jc-s new-folder-item cursor-pointer"
      onMouseOver={() => setIsShow(true)}
      onMouseLeave={() => setIsShow(false)}
    >
      <div className="f-left">
        <i className={`iconfont ${icon}`} style={{ color: color || '#aaa' }}></i>
      </div>
      <div className="f-right">
        <div className="desc">
          <div className="top">{title}</div>
          <div className="down">{description}</div>
        </div>
        {drop && <i className="iconfont icon-e_xiangxiajiantou"></i>}
      </div>
    </div>
  );

  return (
    <>
      {drop ? (
        <Dropdown menu={menuProps} className="drop-down">
          {content}
        </Dropdown>
      ) : (
        content
      )}
      <Portal>
        <Modal
          title="新建文件"
          cancelText="取消"
          okText="确定"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          style={{
            minWidth: '300px',
          }}
        >
          <NewFileModal />
        </Modal>
      </Portal>
    </>
  );
}

export default NewFolderItem;
