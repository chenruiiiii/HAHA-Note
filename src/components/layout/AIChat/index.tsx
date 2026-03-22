import React from 'react';
import InnerHeader from './components/InnerHeader';
import MainContent from '../MainContent';
import ChatInput from '../AIWritingHome/components/ChatInput';
import './style.scss';
import AskBox from './components/AskBox';

const AiChat = () => {
  return (
    <MainContent>
      <InnerHeader title="智能写作"></InnerHeader>
      <div className="chat-box">
        <AskBox></AskBox>
      </div>
      <div className="chat-bottom">
        <ChatInput></ChatInput>
      </div>
    </MainContent>
  );
};

export default AiChat;
