'use client';
import { ReactNode, useEffect, useState } from 'react';
import HALoading from '../../common/HALoading';
interface MainContentProps {
  children: ReactNode;
}

function MainContent({ children }: MainContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  });
  return <div className="main-content">{isLoading ? <HALoading /> : children}</div>;
}

export default MainContent;
