'use client';
import React, { useState } from 'react';
import './style.scss';
import { Input, Dropdown, MenuProps, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const ChatInput = () => {
  const [inputValue, setInputValue] = useState('');
  const router = useRouter();

  const handleSend = () => {
    if (inputValue.trim()) {
      console.log('发送消息:', inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      router.push('/ai-chat');
      handleSend();
    }
  };

  const dropdownItems: MenuProps['items'] = [
    {
      key: '1',
      label: '千问',
    },
  ];

  return (
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
          <div className="circle circle-post">
            <i className="iconfont icon-jijianfasong"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
