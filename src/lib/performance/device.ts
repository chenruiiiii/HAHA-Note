import type { DeviceType } from './types';

interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: string;
  };
}

export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  const width = window.innerWidth;

  if (width < 768) {
    return 'mobile';
  }

  if (width < 1024) {
    return 'tablet';
  }

  return 'desktop';
}

export function getNetworkType() {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }

  return (navigator as NavigatorWithConnection).connection?.effectiveType ?? 'unknown';
}
