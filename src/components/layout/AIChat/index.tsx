'use client';
import { useEffect, useRef } from 'react';
import InnerHeader from './components/InnerHeader';
import ChatInput from '../AIWritingHome/components/ChatInput';
import './style.scss';
import { useChat } from '@ai-sdk/react';
import emitter from '@/utils/mitt';
import ChatBottom from '../AIWritingHome/components/ChatBottom';

const AiChat = () => {
  const { messages, sendMessage } = useChat();
  const chatRef = useRef<HTMLDivElement>(null);

  // 处理具体内容显示
  const handleParts = (id: string, parts: Array<any>) =>
    parts.map((part, i) => {
      // 通知兄弟组件，流式数据即将结束，可以打开发送按钮
      if (i === parts.length - 1) {
        emitter.emit('chat-quit');
      }
      switch (part.type) {
        case 'text':
          return <div key={`${id}-${i}`}>{part.text}</div>;
        case 'image_url':
          return <img src={part.image_url.url} alt="image" />;
        default:
          return null;
      }
    });

  // 处理信息展示为为用户还是ai类型
  const handleContent = (id: string, role: string, parts: Array<any>) => (
    <div className={[role === 'user' ? 'ask-box' : 'answer-box'].join('')} key={id}>
      {handleParts(id, parts)}
    </div>
  );

  // 处理页面滚动
  const handleScroll = () => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const handler = (message: unknown) => {
      sendMessage({ text: message as string });
    };
    emitter.on('chat-message', handler);
    return () => {
      emitter.off('chat-message', handler);
    };
  }, [sendMessage]);
  return (
    <div className="ai-chat-container">
      <div className="header">
        <InnerHeader title="智能写作"></InnerHeader>
      </div>
      <div className="chat-box" ref={chatRef}>
        <div className="container">
          {messages.map((message) => handleContent(message.id, message.role, message.parts))}
        </div>
      </div>
      <ChatBottom></ChatBottom>
    </div>
  );
};

export default AiChat;
