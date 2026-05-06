'use client';
import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import InnerHeader from './components/InnerHeader';
import './style.scss';
import { type UIMessage } from 'ai';
import MDEditor from '@uiw/react-md-editor';
import HALoading from '@/components/common/HALoading';
import emitter from '@/lib/mitt';
import ChatBottom from '../AIWritingHome/components/ChatBottom';
import { useAppSelector } from '@/store';
import { useHaChat } from '@/hooks/common/useHaChat';
import { useOneRequest } from '@/hooks/common/useOneRequest';
import PostingBox from './components/PostingBox';
import { formatTime } from '@/utils/timeFormatter';
import type { AiMissionDetail, AiMissionPart } from '@/models/ai-mission';
import http from '@/lib/http';
import type { ResponseData } from '@/types/response';
import { useAIChatStream } from '@/hooks/common/useAIChatStream';

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

type RenderBlock =
  | {
      type: 'text';
      content: string;
    }
  | {
      type: 'markdown';
      content: string;
    }
  | {
      type: 'image_url';
      part: RenderablePart;
    };

const AiChat = ({ id: _id }: AiChatProps) => {
  const [chatTitle, setChatTitle] = useState('新建文档');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);
  const loadChatDetailRef = useRef<() => Promise<unknown> | unknown>(() => null);
  const { handlePostingClose, handlePostingOpen, requestStatus, lastError, retryCount } = useHaChat();
  const { value } = useAppSelector((state) => ({ ...state.temp }));
  const { checkDuplicate } = useOneRequest();

  const { messages, status, sendMessage, setMessages, stopStream, retryStream } = useAIChatStream({
    chatId: _id,
    onPersisted: () => loadChatDetailRef.current(),
  });

  const loadChatDetail = useCallback(async () => {
    try {
      const response = await http.get<ResponseData<AiMissionDetail>>(`/chat/${_id}`);

      if (response.code !== 200 || !response.data) {
        startTransition(() => {
          setChatTitle('新建文档');
          setMessages([]);
        });
        return null;
      }

      startTransition(() => {
        setChatTitle(response.data.title || '新建文档');
        setMessages((response.data.types ?? []) as unknown as UIMessage[]);
      });

      return response.data;
    } catch {
      startTransition(() => {
        setChatTitle('新建文档');
        setMessages([]);
      });
      return null;
    }
  }, [_id, setMessages]);

  useEffect(() => {
    loadChatDetailRef.current = loadChatDetail;
  }, [loadChatDetail]);

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

  const getRenderableBlocks = useCallback(
    (parts: Array<RenderablePart>) => {
      const blocks: RenderBlock[] = [];

      parts.forEach((part) => {
        const rawType = typeof part?.type === 'string' ? String(part.type) : '';

        if (
          rawType === 'step-start' ||
          rawType === 'step-finish' ||
          rawType === 'start-step' ||
          rawType === 'finish-step'
        ) {
          return;
        }

        if (rawType === 'image_url' || part?.image_url || part?.image) {
          blocks.push({
            type: 'image_url',
            part,
          });
          return;
        }

        const content = getTextContent(part);

        if (!content.trim()) {
          return;
        }

        const blockType = rawType === 'markdown' ? 'markdown' : 'text';
        const lastBlock = blocks[blocks.length - 1];

        if (lastBlock && lastBlock.type === blockType) {
          lastBlock.content += content;
          return;
        }

        blocks.push({
          type: blockType,
          content,
        });
      });

      return blocks;
    },
    [getTextContent]
  );

  const handleParts = useCallback(
    (id: string, parts: Array<RenderablePart>, role: string, showPostingBox: boolean) => {
      const blocks = getRenderableBlocks(parts);

      return (
        <>
          {blocks.map((block, i) => {
            switch (block.type) {
              case 'text':
                return (
                  <div
                    key={`${id}-${i}`}
                    className="message-part"
                    data-color-mode={role !== 'user' ? 'light' : undefined}
                  >
                    {showPostingBox && i === 0 && role !== 'user' && <PostingBox />}
                    {role === 'user' ? (
                      <div className="message-text">{block.content}</div>
                    ) : (
                      <MDEditor.Markdown
                        source={block.content}
                        className="chat-markdown-preview"
                      />
                    )}
                  </div>
                );
              case 'markdown':
                return (
                  <div key={`${id}-${i}`} className="message-part" data-color-mode="light">
                    {showPostingBox && i === 0 && role !== 'user' && <PostingBox />}
                    <MDEditor.Markdown source={block.content} className="chat-markdown-preview" />
                  </div>
                );
              case 'image_url': {
                const imageMeta = getImageMeta(block.part);

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
                return null;
            }
          })}
        </>
      );
    },
    [getImageMeta, getRenderableBlocks]
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
      emitter.emit('start-streaming');
      handleScroll();
    }

    // 再次变为ready时，流式传输结束
    if (status == 'ready') {
      handlePostingClose(); // 关闭发送中按钮
      emitter.emit('quit-streaming'); // 发布事件通知posting-box组件停止流式展示
    }
  }, [handlePostingClose, handleScroll, status]);

  useEffect(() => {
    let cancelled = false;

    const initChatDetail = async () => {
      try {
        await loadChatDetail();
      } finally {
        if (!cancelled) {
          setIsInitialLoading(false);
        }
      }
    };

    void initChatDetail();

    return () => {
      cancelled = true;
    };
  }, [loadChatDetail]);

  useEffect(() => {
    document.title = chatTitle;
  }, [chatTitle]);

  // 结束流式传输，停止发送中状态
  useEffect(() => {
    const handler = () => {
      void stopStream().finally(() => {
        handlePostingClose();
      });
    };
    emitter.on('stop-send-message', handler);
    return () => {
      emitter.off('stop-send-message', handler);
    };
  }, [handlePostingClose, stopStream]);

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
        <InnerHeader title={chatTitle}></InnerHeader>
      </div>
      <div className="chat-box" ref={chatRef}>
        <div className="container">
          {(requestStatus === 'error' || requestStatus === 'retrying') && lastError && (
            <div className="chat-status-banner">
              <span>
                {lastError}
                {retryCount > 0 ? `（第 ${retryCount} 次）` : ''}
              </span>
              {requestStatus === 'error' && (
                <button type="button" onClick={() => void retryStream()}>
                  重新生成
                </button>
              )}
            </div>
          )}
          {isInitialLoading ? (
            <div className="chat-initial-loading">
              <HALoading type="simple" />
            </div>
          ) : (
            messages.map((message, index) =>
              handleContent(
                message.id,
                message.role,
                (message.parts ?? []) as Array<RenderablePart>,
                message.role === 'assistant' && index === messages.length - 1 && status !== 'ready'
              )
            )
          )}
        </div>
      </div>
      <ChatBottom></ChatBottom>
    </div>
  );
};

export default AiChat;
