'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './style.module.scss';
import HALoading from '@/components/common/HALoading';
import useTyping from '@/hooks/useTyping';
interface AnswerBoxProps {
  value?: string;
}

const AnswerBox = ({ value }: AnswerBoxProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const textRef = useRef<HTMLDivElement | null>(null);
  const fullAnswer =
    value ||
    '能用，但有重大风险！​ 虽然技术上可以用，但强烈不推荐在 React/Next.js 项目中直接使用 innerHTML';
  const { typingText } = useTyping({ fullAnswer });

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  });
  return (
    <>
      {isLoading ? (
        <HALoading type="ai" />
      ) : (
        <div className={styles['answer-box']} ref={textRef}>
          {typingText}
        </div>
      )}
    </>
  );
};

export default AnswerBox;
