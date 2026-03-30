import AiChatPage from '@/components/layout/AIChat';
import React from 'react';

interface AIChatProps {
  id: string;
}

const AIChat = ({ id }: AIChatProps) => {
  return <AiChatPage id={id} />;
};

export default AIChat;
