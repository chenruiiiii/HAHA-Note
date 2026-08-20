import type { DeviceType, NetworkType } from './types';

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

  const effectiveType = (navigator as NavigatorWithConnection).connection?.effectiveType;

  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
    case '3g':
    case '4g':
    case '5g':
    case 'wifi':
      return effectiveType as NetworkType;
    default:
      return 'unknown';
  }
}
