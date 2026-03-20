'use client';
import { NEW_DOCUMENT_OPTIONS } from '@/constants/config.ts/start';
import type { MenuProps } from 'antd';
import { Dropdown, message } from 'antd';
import { useState } from 'react';
import './style.scss';

interface FolderItem {
  title: string;
  icon: string;
  type: string;
  color: string;
  description: string;
  drop: boolean;
}

const handleMenuClick: MenuProps['onClick'] = (e) => {
  message.info('Click on menu item.');
  console.log('click', e);
};

const menuProps = {
  items: NEW_DOCUMENT_OPTIONS,
  onClick: handleMenuClick,
};
function NewFolderItem({ title, icon, color, description, drop }: FolderItem) {
  const [_, setIsShow] = useState(false);

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
    </>
  );
}

export default NewFolderItem;
