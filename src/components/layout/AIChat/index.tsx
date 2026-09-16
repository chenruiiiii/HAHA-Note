'use client';
import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import InnerHeader from './components/InnerHeader';
import './style.scss';
import { type UIMessage } from 'ai';
import MDEditor from '@uiw/react-md-editor';
import HALoading from '@/components/common/HALoading';
import emitter from '@/lib/mitt';
import ChatBottom from '../AIWritingHome/components/ChatBottom';
import { useHaChat } from '@/hooks/common/useHaChat';
import { checkDuplicate } from '@/hooks/common/useOneRequest';
import PostingBox from './components/PostingBox';
import { formatMessageTime } from '@/utils/timeFormatter';
import { infoMessage } from '@/utils/message_reminder';
import { CopyOutlined } from '@ant-design/icons';
import type { AiMissionDetail, AiMissionPart } from '@/models/ai-mission';
import http from '@/lib/http';
import type { ResponseData } from '@/types/response';
import { useAIChatStream } from '@/hooks/common/useAIChatStream';
import { mergeChatMessagesForHydration } from '@/lib/ai/snapshot';

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

// 展示层扩展字段：服务端持久化的 createdAt（ISO 字符串/时间戳）或
// 客户端发送时注入的 metadata.sentAt（毫秒时间戳），用于消息时间展示。
type ChatDisplayMessage = UIMessage & {
  createdAt?: string | number;
  metadata?: { sentAt?: number } | Record<string, unknown>;
};

const AiChat = ({ id: _id }: AiChatProps) => {
  const [chatTitle, setChatTitle] = useState('新建文档');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);
  const loadChatDetailRef = useRef<() => Promise<unknown> | unknown>(() => null);
  const { handlePostingClose, handlePostingOpen, requestStatus, lastError, retryCount } =
    useHaChat();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingMessage = searchParams.get('q');
  const pendingModel = searchParams.get('model') ?? undefined;
  const pendingConsumedRef = useRef(false);
  // 首次渲染时 URL 是否带 ?q=（首页发送直达的新会话）：此时会话详情必然还不存在，
  // 直接跳过首次详情拉取，避免一次必现的 404；消息发送完成后 onPersisted 会再拉取。
  const hasPendingMessageOnMountRef = useRef(pendingMessage !== null);

  const { messages, status, sendMessage, setMessages, stopStream, retryStream } = useAIChatStream({
    chatId: _id,
    onPersisted: () => loadChatDetailRef.current(),
  });

  // 消息展示时间兜底：流式回复等无确定时间来源的消息，记录首次出现在界面时的时间
  const [messageTimes, setMessageTimes] = useState<Record<string, number>>({});
  const [observedMessages, setObservedMessages] = useState(messages);

  // 渲染期间派生并回填首次观察时间（React 推荐的 adjusting-state-during-render 模式）：
  // 新出现的、没有确定时间来源的消息（如流式中的 AI 回复）用首次渲染时刻兜底
  if (observedMessages !== messages) {
    setObservedMessages(messages);
    setMessageTimes((prev) => {
      let changed = false;
      const next = { ...prev };

      messages.forEach((message) => {
        if (message.id in next) {
          return;
        }

        const displayMessage = message as ChatDisplayMessage;
        const sentAt = (displayMessage.metadata as { sentAt?: number } | undefined)?.sentAt;
        if (typeof sentAt === 'number' || displayMessage.createdAt != null) {
          return;
        }

        next[message.id] = Date.now();
        changed = true;
      });

      return changed ? next : prev;
    });
  }

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
        const snapshotMessages = (response.data.types ?? []) as unknown as UIMessage[];
        setMessages((currentMessages) =>
          mergeChatMessagesForHydration(currentMessages as UIMessage[], snapshotMessages)
        );
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

  // 归一化消息展示时间：客户端发送注入的 sentAt > 服务端持久化 createdAt > 首次观察时间
  const getMessageTime = useCallback(
    (message: UIMessage): number => {
      const displayMessage = message as ChatDisplayMessage;
      const sentAt = (displayMessage.metadata as { sentAt?: number } | undefined)?.sentAt;

      if (typeof sentAt === 'number' && Number.isFinite(sentAt)) {
        return sentAt;
      }

      if (displayMessage.createdAt != null) {
        const parsed = new Date(displayMessage.createdAt).getTime();
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }

      return messageTimes[message.id] ?? Date.now();
    },
    [messageTimes]
  );

  // 提取消息纯文本（用于复制）
  const getMessagePlainText = useCallback(
    (parts: Array<RenderablePart>): string =>
      parts
        .map((part) => getTextContent(part))
        .filter((text) => text.trim() !== '')
        .join('\n')
        .trim(),
    [getTextContent]
  );

  // 复制消息内容到剪贴板（兼容不支持 Clipboard API 的环境）
  const handleCopy = useCallback(async (text: string) => {
    const content = text || '';

    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    infoMessage('已复制到剪贴板');
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
                    {showPostingBox && i === 0 && role !== 'user' && <PostingBox chatId={_id} />}
                    {role === 'user' ? (
                      <div className="message-text">{block.content}</div>
                    ) : (
                      <MDEditor.Markdown source={block.content} className="chat-markdown-preview" />
                    )}
                  </div>
                );
              case 'markdown':
                return (
                  <div key={`${id}-${i}`} className="message-part" data-color-mode="light">
                    {showPostingBox && i === 0 && role !== 'user' && <PostingBox chatId={_id} />}
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
    [getImageMeta, getRenderableBlocks, _id]
  );

  // 处理信息展示为为用户还是ai类型
  const handleContent = useCallback(
    (
      id: string,
      role: string,
      parts: Array<RenderablePart>,
      showPostingBox: boolean,
      time: number
    ) => {
      const plainText = getMessagePlainText(parts);

      return (
        <div className={[role === 'user' ? 'ask-box' : 'answer-box'].join('')} key={id}>
          {handleParts(id, parts, role, showPostingBox)}
          <div className={role === 'user' ? 'ask-meta' : 'answer-meta'}>
            {plainText && (
              <button
                type="button"
                className="message-copy-btn"
                onClick={() => void handleCopy(plainText)}
              >
                <CopyOutlined />
                <span>复制</span>
              </button>
            )}
            <span className="message-time">{formatMessageTime(time)}</span>
          </div>
        </div>
      );
    },
    [getMessagePlainText, handleCopy, handleParts]
  );

  // 处理页面滚动
  const handleScroll = useCallback(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, []);

  // 流式过程自动滚动到底部（2.5.1）
  useEffect(() => {
    if (status === 'streaming') {
      handleScroll();
    }
  }, [handleScroll, messages, status]);

  // 监听status
  useEffect(() => {
    // 再次变为submitted时，说明开始新的请求，新对话滚动到可视窗口最上方
    if (status == 'submitted') {
      emitter.emit('start-streaming', { chatId: _id });
      handleScroll();
    }

    // 再次变为ready时，流式传输结束
    if (status == 'ready') {
      handlePostingClose(); // 关闭发送中按钮
      emitter.emit('quit-streaming', { chatId: _id }); // 发布事件通知posting-box组件停止流式展示
    }
  }, [handlePostingClose, handleScroll, status, _id]);

  useEffect(() => {
    let cancelled = false;

    const initChatDetail = async () => {
      try {
        if (!hasPendingMessageOnMountRef.current) {
          await loadChatDetail();
        }
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

  // 结束流式传输，停止发送中状态（只处理属于当前会话的事件）
  useEffect(() => {
    const handler = (payload: { chatId: string }) => {
      const { chatId } = payload;
      if (chatId !== _id) return;
      void stopStream().finally(() => {
        handlePostingClose();
      });
    };
    emitter.on('stop-send-message', handler);
    return () => {
      emitter.off('stop-send-message', handler);
    };
  }, [handlePostingClose, stopStream, _id]);

  // chat-put组件发布 chat-message 消息时候发送消息（携带 chatId 与模型，只处理当前会话）
  useEffect(() => {
    const handler = (payload: { message: string; chatId: string; model?: string }) => {
      const { message, chatId, model } = payload;
      if (chatId !== _id) return;
      if (checkDuplicate(message, {})) return;
      sendMessage(
        { text: message, metadata: { sentAt: Date.now() } },
        { body: { chatId, model } }
      );
    };
    emitter.on('chat-message', handler);
    return () => {
      emitter.off('chat-message', handler);
    };
  }, [sendMessage, _id]);

  // 从 ai-chat-home 跳转过来后直接发送请求（消息来自 URL searchParams，消费后清理防止刷新重发）
  useEffect(() => {
    if (isInitialLoading) return;
    if (!pendingMessage || pendingConsumedRef.current) return;
    if (checkDuplicate(pendingMessage, {})) return;
    pendingConsumedRef.current = true;
    handlePostingOpen();
    sendMessage(
      { text: pendingMessage, metadata: { sentAt: Date.now() } },
      { body: { chatId: _id, model: pendingModel } }
    );
    router.replace(`/ai-chat/${_id}`);
  }, [_id, handlePostingOpen, isInitialLoading, pendingMessage, pendingModel, router, sendMessage]);

  return (
    <div className="ai-chat-container">
      <div className="header">
        <InnerHeader title={chatTitle}></InnerHeader>
      </div>
      <div className="chat-box" ref={chatRef}>
        <div className="container">
          {requestStatus === 'retrying' && lastError && (
            <div className="chat-status-banner">
              <span>
                {lastError}
                {retryCount > 0 ? `（第 ${retryCount} 次）` : ''}
              </span>
            </div>
          )}
          {isInitialLoading ? (
            <div className="chat-initial-loading">
              <HALoading type="simple" />
            </div>
          ) : (
            <>
              {messages.map((message, index) =>
                handleContent(
                  message.id,
                  message.role,
                  (message.parts ?? []) as Array<RenderablePart>,
                  message.role === 'assistant' && index === messages.length - 1 && status !== 'ready',
                  getMessageTime(message)
                )
              )}

              {/* 等待 AI 首轮回复 / 回复过程中：独立 loading 气泡（最后一条是用户消息时） */}
              {(requestStatus === 'submitted' ||
                requestStatus === 'retrying' ||
                requestStatus === 'streaming') &&
                messages.length > 0 &&
                messages[messages.length - 1].role === 'user' && (
                  <div className="answer-box chat-pending-box">
                    <PostingBox chatId={_id} />
                  </div>
                )}

              {/* 本轮回答失败：AI 侧展示固定友好文案 + 重试（不直白暴露接口信息） */}
              {requestStatus === 'error' &&
                messages.length > 0 &&
                messages[messages.length - 1].role === 'user' && (
                  <div className="answer-box chat-error-box">
                    <div className="chat-error-content">
                      <span>啊欧～出错了，稍后再试吧～</span>
                      <button type="button" onClick={() => void retryStream()}>
                        重新生成
                      </button>
                    </div>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
      <ChatBottom></ChatBottom>
    </div>
  );
};

export default AiChat;
