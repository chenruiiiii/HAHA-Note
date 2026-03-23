import React from 'react';
import styles from './style.module.scss';
import TextArea from 'antd/es/input/TextArea';

interface AskBoxProps {
  value?: string;
}

const AskBox = ({ value }: AskBoxProps) => {
  return <div className={styles['ask-box']}>问题{value}</div>;
};

export default AskBox;
