'use client';

import { Modal, Button, Space, Typography } from 'antd';
import { CloudDownloadOutlined, EditOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

export interface ConflictDialogProps {
  open: boolean;
  conflictVersion: number | null;
  onLoadServer: () => void;
  onKeepLocal: () => void;
}

/**
 * 409 冲突处理对话框。
 *
 * 提供两个选项，任一选择均不静默覆盖对方：
 * - 加载服务端版本：丢弃本地编辑，拉取服务端最新内容
 * - 保留当前内容：以服务端版本为新 baseVersion，用户手动合并后再次保存
 */
export default function ConflictDialog({
  open,
  conflictVersion,
  onLoadServer,
  onKeepLocal,
}: ConflictDialogProps) {
  return (
    <Modal
      title="文档版本冲突"
      open={open}
      closable={false}
      maskClosable={false}
      footer={
        <Space>
          <Button
            icon={<CloudDownloadOutlined />}
            onClick={onLoadServer}
          >
            加载服务端版本
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={onKeepLocal}
          >
            保留当前内容人工合并
          </Button>
        </Space>
      }
    >
      <Paragraph>
        检测到文档已被其他会话更新
        {conflictVersion !== null ? `（服务端版本 v${conflictVersion}）` : ''}。
      </Paragraph>
      <Text type="secondary">
        选择「加载服务端版本」将丢弃当前编辑并拉取最新内容；
        选择「保留当前内容人工合并」将以服务端版本为基础，您可以合并后再次保存。
      </Text>
    </Modal>
  );
}
