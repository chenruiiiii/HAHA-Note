import { use, useEffect, useState } from 'react';

interface UseTypingProps {
  fullAnswer: string;
}

export default function useTyping({ fullAnswer }: UseTypingProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [index, setIndex] = useState(0);

  // 返回数据
  const returnData = () => {
    if (index < fullAnswer.length) {
      setTimeout(() => {
        setTypingText(fullAnswer.slice(0, index + 1));
        setIndex(index + 1);
      }, 50);
    } else {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (isTyping) {
      returnData();
    }
  }, [isTyping]);
  return {
    isTyping,
    typingText,
    returnData,
  };
}
