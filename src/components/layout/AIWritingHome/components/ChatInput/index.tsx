'use client';
import React, { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import './style.scss';
import { Input, Dropdown, MenuProps, Space, Tooltip } from 'antd';
import { CloseOutlined, DownOutlined, LoadingOutlined } from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import { errorMessage, infoMessage, warningMessage } from '@/utils/message_reminder';
import { useHaChat } from '@/hooks/common/useHaChat';
import { useAvailableModels } from '@/hooks/common/useAvailableModels';
import { refreshAuthSession } from '@/lib/http';
import type { ResponseData } from '@/types/response';

interface QueuedMessage {
  message: string;
  model?: string;
}

type AttachmentStatus = 'parsing' | 'ready' | 'error';

interface ChatAttachment {
  id: string;
  fileName: string;
  status: AttachmentStatus;
  text?: string;
  error?: string;
  truncated?: boolean;
}

interface ParsedAttachment {
  fileName: string;
  extension: string;
  text: string;
  truncated: boolean;
}

const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.docx', '.doc', '.pdf'];
const SUPPORTED_ACCEPT = SUPPORTED_EXTENSIONS.join(',');
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

function createAttachmentId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';
}

async function parseAttachment(file: File): Promise<ParsedAttachment> {
  const formData = new FormData();
  formData.append('file', file);

  const request = () =>
    fetch('/api/chat-attachments', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

  let response = await request();

  if (response.status === 401) {
    await refreshAuthSession();
    response = await request();
  }

  const payload = (await response.json().catch(() => null)) as
    | ResponseData<ParsedAttachment | null>
    | null;

  if (!response.ok || !payload || payload.code !== 200 || !payload.data) {
    throw new Error(payload?.message || '附件解析失败');
  }

  return payload.data;
}

const ChatInput = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const isChatPage = typeof pathname === 'string' && pathname.startsWith('/ai-chat/');
  const { isPosting, requestStatus, activeChatId, handleSend } = useHaChat();
  const { modelOptions } = useAvailableModels();
  // 回答中发送的新问题进入等待队列，当前回答结束后自动依次回答
  const queueRef = useRef<QueuedMessage[]>([]);

  // 切换会话时清空上一个会话遗留的等待队列和附件
  useEffect(() => {
    queueRef.current = [];
    const clearTimer = setTimeout(() => setAttachments([]), 0);

    return () => clearTimeout(clearTimer);
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

  const activeModelId =
    selectedModel && modelOptions.some((item) => item.id === selectedModel)
      ? selectedModel
      : modelOptions[0]?.id;
  const currentModelLabel =
    modelOptions.find((item) => item.id === activeModelId)?.name ?? '默认模型';

  const dropdownItems: MenuProps['items'] =
    modelOptions.length > 0
      ? modelOptions.map((item) => ({
          key: item.id,
          label: item.name,
        }))
      : [{ key: 'default', label: '默认模型', disabled: true }];

  const isParsingAttachment = attachments.some((item) => item.status === 'parsing');
  const hasReadyAttachment = attachments.some((item) => item.status === 'ready' && item.text);
  const hasSendableContent = inputValue.trim() !== '' || hasReadyAttachment;

  const buildOutgoingMessage = () => {
    const attachmentContext = attachments
      .filter(
        (item): item is ChatAttachment & { text: string } =>
          item.status === 'ready' && typeof item.text === 'string' && item.text.length > 0
      )
      .map((item) => {
        const marker = item.truncated ? `[附件: ${item.fileName}（内容已截断）]` : `[附件: ${item.fileName}]`;
        return `${marker}\n${item.text}`;
      })
      .join('\n\n');

    return [inputValue.trim(), attachmentContext].filter(Boolean).join('\n\n');
  };

  // 通知兄弟组件发送消息并展示流式数据内容；回答中发送则进入等待队列
  const handleSendMessage = (message: string, model?: string) => {
    if (isChatPage && isPosting) {
      queueRef.current = [...queueRef.current, { message, model }];
      infoMessage('已加入等待队列，当前回答结束后自动发送');
      return;
    }

    handleSend(message, model);
  };

  const clearComposer = () => {
    setInputValue('');
    setAttachments([]);
  };

  // 回答中且没有可发送内容：icon 置灰；有文字或附件时可排队追问
  const iconDisabled = isPosting && !hasSendableContent;

  const handleSendClick = () => {
    if (iconDisabled) {
      return;
    }

    if (isParsingAttachment) {
      infoMessage('附件正在解析，请稍候再发送');
      return;
    }

    if (!hasSendableContent) {
      warningMessage('请输入内容或添加附件！');
      return;
    }

    handleSendMessage(buildOutgoingMessage(), activeModelId);
    clearComposer();
  };

  // 输入框回车事件：回答中发送会进入等待队列
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return;

    e.preventDefault();

    if (isParsingAttachment) {
      infoMessage('附件正在解析，请稍候再发送');
      return;
    }

    if (!hasSendableContent) {
      warningMessage('请输入内容或添加附件！');
      return;
    }

    handleSendMessage(buildOutgoingMessage(), activeModelId);
    clearComposer();
  };

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (files.length === 0) return;

    const validFiles: File[] = [];

    files.forEach((file) => {
      const extension = getFileExtension(file.name);

      if (!SUPPORTED_EXTENSIONS.includes(extension)) {
        errorMessage(`${file.name}：仅支持 txt、md、docx、doc、pdf 文件`);
        return;
      }

      if (file.size > MAX_ATTACHMENT_BYTES) {
        errorMessage(`${file.name}：附件大小不能超过 10 MB`);
        return;
      }

      validFiles.push(file);
    });

    const pendingItems = validFiles.map((file) => ({
      id: createAttachmentId(),
      fileName: file.name,
      status: 'parsing' as const,
    }));

    setAttachments((current) => [...current, ...pendingItems]);

    validFiles.forEach((file, index) => {
      const item = pendingItems[index];

      void parseAttachment(file)
        .then((parsed) => {
          setAttachments((current) =>
            current.map((attachment) =>
              attachment.id === item.id
                ? {
                    ...attachment,
                    fileName: parsed.fileName,
                    status: 'ready',
                    text: parsed.text,
                    truncated: parsed.truncated,
                  }
                : attachment
            )
          );
          infoMessage(`已添加附件：${parsed.fileName}`);
        })
        .catch((error) => {
          const reason = error instanceof Error ? error.message : '附件解析失败';
          setAttachments((current) =>
            current.map((attachment) =>
              attachment.id === item.id
                ? { ...attachment, status: 'error', error: reason }
                : attachment
            )
          );
          errorMessage(`${file.name}：${reason}`);
        });
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((current) => current.filter((item) => item.id !== id));
  };

  const sendTooltip = isParsingAttachment
    ? '附件解析中，请稍候'
    : iconDisabled
      ? 'AI 回答中，不可打断'
      : isPosting
        ? '发送消息（回答结束后自动回答）'
        : '发送消息';

  return (
    <>
      <div className="chat-input-container">
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_ACCEPT}
          multiple
          className="attachment-input"
          onChange={handleFilesSelected}
        />
        <div className="input-area">
          <Input.TextArea
            id="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="做一个贪吃蛇游戏，带积分榜数据库"
            autoSize={{ minRows: 1, maxRows: 4 }}
            className={`chat-textarea ${attachments.length > 0 ? 'has-attachments' : ''}`}
          />
          {attachments.length > 0 && (
            <div className="attachment-list">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={`attachment-item is-${attachment.status}`}
                  title={attachment.error || attachment.fileName}
                >
                  {attachment.status === 'parsing' ? (
                    <LoadingOutlined spin />
                  ) : (
                    <span className="attachment-file-icon">DOC</span>
                  )}
                  <span className="attachment-name">{attachment.fileName}</span>
                  {attachment.status === 'parsing' && <span className="attachment-state">解析中</span>}
                  {attachment.status === 'error' && <span className="attachment-state">失败</span>}
                  {attachment.truncated && <span className="attachment-state">已截断</span>}
                  <button
                    type="button"
                    className="attachment-remove"
                    aria-label={`移除附件 ${attachment.fileName}`}
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    <CloseOutlined />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="input-actions">
          <div className="actions-l">
            <Tooltip title="添加附件" placement="top">
              <div
                className="circle cursor-pointer transition-all"
                role="button"
                tabIndex={0}
                aria-label="添加附件"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <i className="iconfont icon-tianjia1"></i>
              </div>
            </Tooltip>
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
