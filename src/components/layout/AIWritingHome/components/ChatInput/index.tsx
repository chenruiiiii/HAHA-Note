'use client';
import React, { useEffect, useState } from 'react';
import './style.scss';
import { Input, Dropdown, MenuProps, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import emitter from '@/utils/mitt';
import useMessage from '@/hooks/useMessage';

const ChatInput = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const { warningMessage, contextHolder } = useMessage();

  // 通知兄弟组件发送消息并展示流式数据内容
  const handleSendMessage = () => {
    // 先发消息，再路由跳转，避免信息丢失
    emitter.emit('chat-message', inputValue);
    if (pathname === '/ai-chat-home') {
      router.push('/ai-chat');
    }
    setInputValue('');
  };

  // 发送按钮点击事件
  const handleSendClick = () => {
    if (inputValue.trim() === '') {
      warningMessage('请输入内容！');
      return;
    } else {
      handleSendMessage();
    }
  };

  // 输入框回车事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (inputValue.trim() === '') {
      warningMessage('请输入内容！');
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const dropdownItems: MenuProps['items'] = [
    {
      key: '1',
      label: 'deepseek v3.2',
    },
  ];

  useEffect(() => {
    const handlePostStatus = () => {
      setIsPosting(true);
    };
    emitter.on('chat-quit', handlePostStatus);
    return () => {
      emitter.off('chat-quit', handlePostStatus);
    };
  });

  return (
    <>
      {contextHolder}
      <div className="chat-input-container">
        <div className="input-area">
          <Input.TextArea
            id="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="做一个贪吃蛇游戏，带积分榜数据库"
            autoSize={{ minRows: 1, maxRows: 4 }}
            className="chat-textarea"
          />
        </div>

        <div className="input-actions">
          <div className="actions-l">
            <div className="circle cursor-pointer transition-all">
              <i className="iconfont icon-tianjia1"></i>
            </div>
            <div className="circle cursor-pointer transition-all">
              <i className="iconfont icon-aite"></i>
            </div>
          </div>
          <div className="actions-r">
            <div className="drop-down cursor-pointer transition-all">
              <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
                <Space>
                  <img src="../../../../../assets/images/avatar.png" alt="" />
                  deepseek v2.0
                  <DownOutlined />
                </Space>
              </Dropdown>
            </div>
            <div className="circle-post" onClick={handleSendClick}>
              {isPosting ? (
                <i className="iconfont icon-loading-solid"></i>
              ) : (
                <i className="iconfont icon-jijianfasong"></i>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatInput;
