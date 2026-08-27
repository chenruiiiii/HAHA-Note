'use client';
import React, { KeyboardEvent, useState } from 'react';
import './style.scss';
import { Input, Dropdown, MenuProps, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { warningMessage } from '@/utils/message_reminder';
import { useHaChat } from '@/hooks/common/useHaChat';

const ChatInput = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const { isPosting, handleSend, stopSendMessage } = useHaChat();

  // 通知兄弟组件发送消息并展示流式数据内容
  const handleSendMessage = () => {
    handleSend(inputValue);
    setInputValue('');
  };

  // 发送按钮点击事件：发送中点击 = 停止当前生成（防止重复提交）
  const handleSendClick = () => {
    if (isPosting) {
      stopSendMessage();
      return;
    }

    if (inputValue.trim() === '') {
      warningMessage('请输入内容！');
      return;
    }

    handleSendMessage();
  };

  // 输入框回车事件：发送中禁止再次发送
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      if (isPosting) {
        warningMessage('内容正在生成中，请稍候或点击停止');
        return;
      }

      if (inputValue.trim() === '') {
        warningMessage('请输入内容！');
        return;
      }

      handleSendMessage();
    }
  };

  const dropdownItems: MenuProps['items'] = [
    {
      key: '1',
      label: 'deepseek v3.2',
    },
  ];

  return (
    <>
      <div className="chat-input-container">
        <div className="input-area">
          <Input.TextArea
            id="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
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
            {/* <div className="circle cursor-pointer transition-all">
              <i className="iconfont icon-aite"></i>
            </div> */}
          </div>
          <div className="actions-r">
            <div className="drop-down cursor-pointer transition-all">
              <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
                <Space>
                  <img src="../../../../../assets/images/avatar.png" alt="" />
                  deepseek v3.2
                  <DownOutlined />
                </Space>
              </Dropdown>
            </div>
            <div className="circle-post cursor-pointer" onClick={handleSendClick}>
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
