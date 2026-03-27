'use client';
import { ReactNode, useEffect, useState } from 'react';
import HALoading from '../../common/HALoading';
import './style.scss';
interface MainContentProps {
  children: ReactNode;
}

function MainContent({ children }: MainContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  });
  return <div className="main-content">{isLoading ? <HALoading type="simple" /> : children}</div>;
}

export default MainContent;
