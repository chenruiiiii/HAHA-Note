'use client';
import React, { KeyboardEvent, useEffect, useState } from 'react';
import './style.scss';
import { Input, Dropdown, MenuProps, Space, Tooltip } from 'antd';
import { DownOutlined, BorderOutlined } from '@ant-design/icons';
import { warningMessage } from '@/utils/message_reminder';
import { useHaChat } from '@/hooks/common/useHaChat';
import http from '@/lib/http';
import type { ResponseData } from '@/types/response';

interface AiModelOption {
  id: string;
  name: string;
}

const ChatInput = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const [modelOptions, setModelOptions] = useState<AiModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const { isPosting, handleSend, stopSendMessage } = useHaChat();

  // 拉取服务端白名单模型列表，驱动下拉；失败时静默回退（展示默认文案，不阻断输入）
  useEffect(() => {
    let cancelled = false;

    const loadModels = async () => {
      try {
        const response = await http.get<ResponseData<AiModelOption[]>>('/ai-models');

        if (!cancelled && response.code === 200 && Array.isArray(response.data)) {
          setModelOptions(response.data);
          if (response.data.length > 0) {
            setSelectedModel(response.data[0].id);
          }
        }
      } catch {
        // 忽略：下拉保持空，回退默认模型
      }
    };

    void loadModels();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentModelLabel =
    modelOptions.find((item) => item.id === selectedModel)?.name ?? '默认模型';

  const dropdownItems: MenuProps['items'] =
    modelOptions.length > 0
      ? modelOptions.map((item) => ({
          key: item.id,
          label: item.name,
        }))
      : [{ key: 'default', label: '默认模型', disabled: true }];

  // 通知兄弟组件发送消息并展示流式数据内容
  const handleSendMessage = () => {
    handleSend(inputValue, selectedModel);
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
              <Dropdown
                menu={{
                  items: dropdownItems,
                  onClick: ({ key }) => setSelectedModel(key),
                }}
                trigger={['click']}
              >
                <Space>
                  <img src="../../../../../assets/images/avatar.png" alt="" />
                  {currentModelLabel}
                  <DownOutlined />
                </Space>
              </Dropdown>
            </div>
            <Tooltip title={isPosting ? '停止生成' : '发送消息'} placement="top">
              <div
                className={`circle-post cursor-pointer ${isPosting ? 'is-posting' : ''}`}
                onClick={handleSendClick}
              >
                {isPosting ? (
                  <BorderOutlined className="stop-icon" />
                ) : (
                  <i className="iconfont icon-jijianfasong"></i>
                )}
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatInput;
