'use client';
import './style.scss';
import MainContent from '../MainContent';
import Header from './components/OuterHeader';
import ChatInput from './components/ChatInput';
import CaseContainer from './components/CaseContainer';
import { useState } from 'react';

function AIWriting() {
  const [isShowInput, setIsShowInput] = useState(false);
  return (
    <MainContent>
      <Header></Header>
      <ChatInput></ChatInput>
      <CaseContainer></CaseContainer>
      {isShowInput && (
        <div className="input">
          <ChatInput></ChatInput>
        </div>
      )}
    </MainContent>
  );
}

export default AIWriting;
