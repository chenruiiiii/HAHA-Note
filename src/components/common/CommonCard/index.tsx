import React from 'react';
import './style.scss';
interface CommonCardProps {
  children: React.ReactNode;
}

const CommonCard = ({ children }: CommonCardProps) => {
  return <div className="common-card">{children}</div>;
};

export default CommonCard;
