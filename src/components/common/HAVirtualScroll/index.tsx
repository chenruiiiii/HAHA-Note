import React from 'react';
import './style.scss';

interface HAVirtualScrollProps {
  children: React.ReactNode;
}

function HAVirtualScroll({ children }: HAVirtualScrollProps) {
  return <div className="ha-virtual-scroll">{children}</div>;
}

export default HAVirtualScroll;
