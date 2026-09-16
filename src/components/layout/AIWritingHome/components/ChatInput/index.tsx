'use client';
import React, { KeyboardEvent, useEffect, useRef, useState } from 'react';
import './style.scss';
import { Input, Dropdown, MenuProps, Space, Tooltip } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import { infoMessage, warningMessage } from '@/utils/message_reminder';
import { useHaChat } from '@/hooks/common/useHaChat';
import http from '@/lib/http';
import type { ResponseData } from '@/types/response';

interface AiModelOption {
  id: string;
  name: string;
}

interface QueuedMessage {
  message: string;
  model?: string;
}

const ChatInput = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const [modelOptions, setModelOptions] = useState<AiModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const pathname = usePathname();
  const isChatPage = typeof pathname === 'string' && pathname.startsWith('/ai-chat/');
  const { isPosting, requestStatus, activeChatId, handleSend } = useHaChat();
  // 回答中发送的新问题进入等待队列，当前回答结束后自动依次回答
  const queueRef = useRef<QueuedMessage[]>([]);

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

  // 切换会话时清空上一个会话遗留的等待队列
  useEffect(() => {
    queueRef.current = [];
  }, [activeChatId]);

  // 当前回答结束后，自动回答等待队列中的下一条
  useEffect(() => {
    if (!isChatPage) return;

    const busy =
      requestStatus === 'submitted' ||
      requestStatus === 'streaming' ||
      requestStatus === 'retrying';
    if (busy || queueRef.current.length === 0) return;

    const [next, ...rest] = queueRef.current;
    queueRef.current = rest;
    handleSend(next.message, next.model);
  }, [isChatPage, requestStatus, handleSend]);

  const currentModelLabel =
    modelOptions.find((item) => item.id === selectedModel)?.name ?? '默认模型';

  const dropdownItems: MenuProps['items'] =
    modelOptions.length > 0
      ? modelOptions.map((item) => ({
          key: item.id,
          label: item.name,
        }))
      : [{ key: 'default', label: '默认模型', disabled: true }];

  // 通知兄弟组件发送消息并展示流式数据内容；回答中发送则进入等待队列
  const handleSendMessage = (message: string, model?: string) => {
    if (isChatPage && isPosting) {
      queueRef.current = [...queueRef.current, { message, model }];
      infoMessage('已加入等待队列，当前回答结束后自动发送');
      return;
    }

    handleSend(message, model);
  };

  // 回答中且输入框为空：icon 置灰，不可打断本次回答
  const iconDisabled = isPosting && inputValue.trim() === '';

  // 发送按钮点击事件
  const handleSendClick = () => {
    if (iconDisabled) {
      return;
    }

    if (inputValue.trim() === '') {
      warningMessage('请输入内容！');
      return;
    }

    handleSendMessage(inputValue, selectedModel);
    setInputValue('');
  };

  // 输入框回车事件：回答中发送会进入等待队列
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      if (inputValue.trim() === '') {
        warningMessage('请输入内容！');
        return;
      }

      handleSendMessage(inputValue, selectedModel);
      setInputValue('');
    }
  };

  const sendTooltip = iconDisabled
    ? 'AI 回答中，不可打断'
    : isPosting
      ? '发送消息（回答结束后自动回答）'
      : '发送消息';

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
            <Tooltip title={sendTooltip} placement="top">
              <div
                className={`circle-post cursor-pointer ${iconDisabled ? 'is-disabled' : ''}`}
                onClick={handleSendClick}
              >
                <i className="iconfont icon-jijianfasong"></i>
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatInput;
