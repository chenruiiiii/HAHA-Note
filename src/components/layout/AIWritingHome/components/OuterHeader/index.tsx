'use client';
import React, { useState } from 'react';
import './style.scss';
import { Button } from 'antd';
import { AI_CHAT_HEADER } from '@/constants/config.ts/ai-chat';
import ChatListModal from '@/components/layout/ChatListModal';

function Header() {
  const [open, setOpen] = useState(false);
  const handlePortalStatus = () => {
    setOpen(!open);
  };
  return (
    <>
      <header className="header-container">
        <div className="header-top common.f-sb">
          <div className="task-list-btn common.f-left cursor-pointer">
            <Button onClick={handlePortalStatus}>
              <i className="iconfont icon--_renwuliebiao"></i>
              任务列表
            </Button>
          </div>
          <div className="header-right common.f-right">
            {/* <div className="points">13000 积分</div> */}
            {/* <div className="return-old-version cursor-pointer">返回旧版</div> */}
          </div>
        </div>
        <div className="header-center common.f-center">
          <div className="title">{AI_CHAT_HEADER.title}</div>
          {/* <div className="tags cursor-pointer">
          {AI_CHAT_HEADER.tags.map((tag, index) => (
            <div className="tag .hover-theme-color" key={index}>
              <i className={`iconfont ${tag.icon}`}></i>
              <span className="name">{tag.name}</span>
            </div>
          ))}
        </div> */}
        </div>
      </header>
      {open && <ChatListModal></ChatListModal>}
    </>
  );
}

export default Header;
