import AiChatPage from '@/components/layout/AIChat';
import React from 'react';

interface AIChatProps {
  params: Promise<{
    id: string;
  }>;
}

const AIChat = async ({ params }: AIChatProps) => {
  const { id } = await params;
  return <AiChatPage id={id} />;
};

export default AIChat;
