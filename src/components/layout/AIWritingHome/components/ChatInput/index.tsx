'use client';
import React, { KeyboardEvent, useState } from 'react';
import './style.scss';
import { Input, Dropdown, MenuProps, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { warningMessage } from '@/utils/message_reminder';
import { useHaChat } from '@/hooks/common/useHaChat';
import emitter from '@/utils/mitt';

const ChatInput = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const { isPosting, handleSend, handlePostingClose } = useHaChat();

  // 通知兄弟组件发送消息并展示流式数据内容
  const handleSendMessage = () => {
    handleSend(inputValue);
    setInputValue('');
  };

  // 发送按钮点击事件
  const handleSendClick = () => {
    if (isPosting) {
      warningMessage('已停止消息输出，若需重新开始再次输入！');
      emitter.emit('stop-send-message');
      handlePostingClose();
    } else {
      if (inputValue.trim() === '') {
        warningMessage('请输入内容！');
        return;
      } else {
        handleSendMessage();
      }
    }
  };

  // 输入框回车事件
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
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
