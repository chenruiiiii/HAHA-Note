'use client';
import { ReactNode } from 'react';
import HALoading from '../../common/HALoading';
import './style.scss';
interface MainContentProps {
  children: ReactNode;
  isLoading?: boolean;
}

function MainContent({ children, isLoading = false }: MainContentProps) {
  return (
    <div className="main-content">
      {children}
      {isLoading && (
        <div className="main-content__loading">
          <HALoading type="simple" />
        </div>
      )}
    </div>
  );
}

export default MainContent;
