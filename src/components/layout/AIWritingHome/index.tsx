'use client';
import './style.scss';
import MainContent from '../MainContent';
import Header from './components/OuterHeader';
import { useState } from 'react';
import ChatBottom from './components/ChatBottom';

function AIWriting() {
  const [isShowInput, setIsShowInput] = useState(false);
  return (
    <MainContent>
      <Header></Header>
      {/* <CaseContainer></CaseContainer> */}
      <ChatBottom></ChatBottom>
    </MainContent>
  );
}

export default AIWriting;
