import React from 'react';
import './style.scss';
import TextArea from 'antd/es/input/TextArea';

interface AskBoxProps {
  value?: string;
}

const AskBox = ({ value }: AskBoxProps) => {
  return (
    <div className="ask-box">
      <TextArea id={`ask-box-textarea-${Date.now()}}`} value={value}></TextArea>
    </div>
  );
};

export default AskBox;
