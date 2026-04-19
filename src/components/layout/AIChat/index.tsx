'use client';
import { useCallback, useEffect, useRef } from 'react';
import InnerHeader from './components/InnerHeader';
import './style.scss';
import { useChat } from '@ai-sdk/react';
import MDEditor from '@uiw/react-md-editor';
import emitter from '@/lib/mitt';
import ChatBottom from '../AIWritingHome/components/ChatBottom';
import { useAppSelector } from '@/store';
import { useHaChat } from '@/hooks/common/useHaChat';
import { useOneRequest } from '@/hooks/common/useOneRequest';
import PostingBox from './components/PostingBox';
import { formatTime } from '@/utils/timeFormatter';
import type { AiMissionPart } from '@/models/ai-mission';

interface AiChatProps {
  id: string;
}

type RenderablePart = Partial<AiMissionPart> & {
  type?: string;
  text?: string;
  markdown?: string;
  content?: string;
  image_url?: {
    url?: string;
    alt?: string;
    width?: number;
    height?: number;
  } | null;
  image?: {
    url?: string;
    alt?: string;
    width?: number;
    height?: number;
  } | null;
  url?: string;
  src?: string;
  alt?: string;
  [key: string]: unknown;
};

const AiChat = ({ id: _id }: AiChatProps) => {
  void _id;
  const { messages, status, sendMessage } = useChat();
  const chatRef = useRef<HTMLDivElement>(null);
  const { handlePostingClose, handlePostingOpen } = useHaChat();
  const { value } = useAppSelector((state) => ({ ...state.temp }));
  const { checkDuplicate } = useOneRequest();

  // 处理具体内容显示
  const getImageMeta = useCallback((part: RenderablePart) => {
    const payload = part?.image_url ?? part?.image ?? {};
    const url = payload?.url ?? part?.url ?? part?.src;

    if (typeof url !== 'string' || !url) {
      return null;
    }

    return {
      url,
      alt:
        typeof payload?.alt === 'string'
          ? payload.alt
          : typeof part?.alt === 'string'
            ? part.alt
            : 'image',
    };
  }, []);

  const getTextContent = useCallback((part: RenderablePart) => {
    if (typeof part?.text === 'string') {
      return part.text;
    }

    if (typeof part?.markdown === 'string') {
      return part.markdown;
    }

    if (typeof part?.content === 'string') {
      return part.content;
    }

    return '';
  }, []);

  const handleParts = useCallback(
    (id: string, parts: Array<RenderablePart>, role: string, showPostingBox: boolean) => {
      return (
        <>
          {parts.map((part, i) => {
            const partType =
              typeof part?.type === 'string'
                ? part.type
                : typeof part?.text === 'string'
                  ? 'text'
                  : typeof part?.markdown === 'string'
                    ? 'markdown'
                    : part?.image_url || part?.image
                      ? 'image_url'
                      : 'unknown';

            switch (partType) {
              case 'text':
                return (
                  <div key={`${id}-${i}`} className="message-part">
                    {showPostingBox && i === 0 && role !== 'user' && <PostingBox />}
                    <div className="message-text">{getTextContent(part)}</div>
                  </div>
                );
              case 'markdown':
                return (
                  <div key={`${id}-${i}`} className="message-part" data-color-mode="light">
                    {showPostingBox && i === 0 && role !== 'user' && <PostingBox />}
                    <MDEditor.Markdown
                      source={getTextContent(part)}
                      className="chat-markdown-preview"
                    />
                  </div>
                );
              case 'image_url': {
                const imageMeta = getImageMeta(part);

                if (!imageMeta) {
                  return null;
                }

                return (
                  <div key={`${id}-${i}`} className="message-part">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="chat-image" src={imageMeta.url} alt={imageMeta.alt} />
                  </div>
                );
              }
              default:
                return (
                  <pre key={`${id}-${i}`} className="message-part message-fallback">
                    {JSON.stringify(part, null, 2)}
                  </pre>
                );
            }
          })}
        </>
      );
    },
    [getImageMeta, getTextContent]
  );

  // 处理信息展示为为用户还是ai类型
  const handleContent = useCallback(
    (id: string, role: string, parts: Array<RenderablePart>, showPostingBox: boolean) => (
      <div className={[role === 'user' ? 'ask-box' : 'answer-box'].join('')} key={id}>
        {handleParts(id, parts, role, showPostingBox)}
        {role === 'user' && <div className="chat-time-user">{formatTime(Date.now())}</div>}
      </div>
    ),
    [handleParts]
  );

  // 处理页面滚动
  const handleScroll = useCallback(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, []);

  // 监听status
  useEffect(() => {
    // 再次变为submitted时，说明开始新的请求，新对话滚动到可视窗口最上方
    if (status == 'submitted') {
      handleScroll();
    }

    // 再次变为ready时，流式传输结束
    if (status == 'ready') {
      handlePostingClose(); // 关闭发送中按钮
      emitter.emit('quit-streaming'); // 发布事件通知posting-box组件停止流式展示
    }
  }, [handlePostingClose, handleScroll, status]);

  // 结束流式传输，停止发送中状态
  useEffect(() => {
    const handler = () => {
      handlePostingClose();
    };
    emitter.on('stop-send-message', handler);
    return () => {
      emitter.off('stop-send-message', handler);
    };
  }, [handlePostingClose]);

  // chat-put组件发布 chat-message 消息时候发送消息
  useEffect(() => {
    const handler = (message: unknown) => {
      if (!checkDuplicate(message as string, {})) {
        sendMessage({ text: message as string });
      }
    };
    emitter.on('chat-message', handler);
    return () => {
      emitter.off('chat-message', handler);
    };
  }, [checkDuplicate, sendMessage]);

  // 从ai-chat-home跳转过来后直接发送请求
  useEffect(() => {
    if (value && !checkDuplicate(value as string, {})) {
      handlePostingOpen();
      sendMessage({ text: value });
    }
  }, [checkDuplicate, handlePostingOpen, sendMessage, value]);

  return (
    <div className="ai-chat-container">
      <div className="header">
        <InnerHeader title="新建对话"></InnerHeader>
      </div>
      <div className="chat-box" ref={chatRef}>
        <div className="container">
          {messages.map((message, index) =>
            handleContent(
              message.id,
              message.role,
              (message.parts ?? []) as Array<RenderablePart>,
              message.role === 'assistant' && index === messages.length - 1 && status !== 'ready'
            )
          )}
        </div>
      </div>
      <ChatBottom></ChatBottom>
    </div>
  );
};

export default AiChat;
