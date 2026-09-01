'use client';

import { SyncOutlined, CheckCircleOutlined, WarningOutlined, DisconnectOutlined, EditOutlined } from '@ant-design/icons';
import { Space, Typography } from 'antd';
import type { AutosaveStatus } from '@/hooks/useDocumentAutosave/reducer';

const { Text } = Typography;

export interface SaveStatusIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt: number | null;
  error: string | null;
}

function formatTime(ts: number | null): string {
  if (!ts) return '';
  const date = new Date(ts);
  const time = [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
  return time;
}

/**
 * 保存状态指示器，在编辑器头部显示当前自动保存状态。
 */
export default function SaveStatusIndicator({ status, lastSavedAt, error }: SaveStatusIndicatorProps) {
  const iconMap = {
    saved: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    dirty: <EditOutlined style={{ color: '#8c8c8c' }} />,
    saving: <SyncOutlined spin style={{ color: '#1677ff' }} />,
    error: <WarningOutlined style={{ color: '#ff4d4f' }} />,
    retrying: <SyncOutlined spin style={{ color: '#faad14' }} />,
    conflict: <WarningOutlined style={{ color: '#fa8c16' }} />,
    offline: <DisconnectOutlined style={{ color: '#8c8c8c' }} />,
  };

  const textMap: Record<AutosaveStatus, string> = {
    saved: lastSavedAt ? `已保存 ${formatTime(lastSavedAt)}` : '已保存',
    dirty: '编辑中...',
    saving: '保存中...',
    error: error ?? '保存失败',
    retrying: '正在重试...',
    conflict: error ?? '版本冲突',
    offline: '网络已断开',
  };

  return (
    <Space size={4}>
      {iconMap[status]}
      <Text type={status === 'saved' ? 'secondary' : status === 'error' || status === 'conflict' ? 'danger' : undefined}>
        {textMap[status]}
      </Text>
    </Space>
  );
}
