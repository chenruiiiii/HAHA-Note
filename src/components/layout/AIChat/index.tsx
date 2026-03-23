import React from 'react';
import InnerHeader from './components/InnerHeader';
import ChatInput from '../AIWritingHome/components/ChatInput';
import './style.scss';
import AskBox from './components/AskBox';
import AnswerBox from './components/AnswerBox';

const AiChat = () => {
  return (
    <div className="ai-chat-container">
      <div className="header"> 
        <InnerHeader title="智能写作"></InnerHeader>
      </div>
      <div className="chat-box">
        <div className="ask-box">
          <AskBox></AskBox>
        </div>
        <div className="answer-box">
          <AnswerBox></AnswerBox>
        </div>
      </div>
      <div className="chat-bottom">
        <ChatInput></ChatInput>
      </div>
    </div>
  );
};

export default AiChat;
