'use client';
import { CSSProperties, ReactNode } from 'react';
import HALoading from '../../common/HALoading';
import './style.scss';
interface MainContentProps {
  children: ReactNode;
  isLoading?: boolean;
  style?: CSSProperties;
}

function MainContent({ children, isLoading = false, style = {} }: MainContentProps) {
  return (
    <div className="main-content" style={style}>
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
