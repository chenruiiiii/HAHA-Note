// 时间格式化
export const formatTime = (time: number): string => {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${year}-${month}-${day} ${hours}:${minutes > 10 ? minutes : '0' + minutes}`;
};

/**
 * 对话消息时间展示：
 * - 当天：显示几点几分（HH:mm）
 * - 昨天：显示“昨天”
 * - 本年（非当天/昨天）：只显示 月+日
 * - 跨年：显示 年+月+日
 */
export const formatMessageTime = (time: number): string => {
  const date = new Date(time);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfTarget) / 86400000);

  const pad = (n: number) => String(n).padStart(2, '0');

  if (dayDiff === 0) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  if (dayDiff === 1) {
    return '昨天';
  }

  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

// 格式化 UTC 时间
export const handleUTCTime = (time: string) => {
  const date = new Date(time);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
};
