import React from 'react';
import './style.scss';
import ChatInput from '../ChatInput';

const ChatBottom = () => {
  return (
    <div className="chat-bottom">
      <div className="container">
        <ChatInput></ChatInput>
      </div>
    </div>
  );
};

export default ChatBottom;
