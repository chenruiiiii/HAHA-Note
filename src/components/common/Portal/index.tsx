'use client';
import React, { useEffect } from 'react';
import './style.scss';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  container?: string;
}

const Portal = ({ children, container = 'portal-root' }: PortalProps) => {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // 确保只在客户端渲染

  const containerElement = document.getElementById(container);
  if (!containerElement) {
    console.log('portal容器未找到！');
  }
  return createPortal(children, containerElement!);
};

export default Portal;
