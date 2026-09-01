'use client';

import { useEffect, useState } from 'react';
import { Modal, Button, Space, Typography, message } from 'antd';
import { CloudUploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { saveDocumentVersioned } from '@/services/docs-detail';

const { Text, Paragraph } = Typography;

const LEGACY_KEY = 'final-note-data';
/** 防止重复弹出迁移提示的标记 key。 */
const MIGRATION_DISMISSED_KEY = 'final-note-data-migration-dismissed';

interface LegacyNoteData {
  content?: string;
  tasks?: unknown[];
  tags?: unknown[];
  attachments?: unknown[];
  updatedAt?: string;
}

/**
 * 一次性 legacy 迁移入口。
 *
 * 仅在登录后检测 `final-note-data` localStorage key：
 * - 展示"导入当前账号 / 删除旧草稿"两个选项
 * - 导入 = 先建云端文档、服务端确认后才 removeItem
 * - 删除 = 二次确认后清理
 * - 解析失败只提示清理，不写日志
 * - 任何路径不自动上传、不跨账号绑定
 */
export default function LegacyNoteMigration({
  docsId,
  currentVersion,
  onImported,
}: {
  docsId: string;
  currentVersion: number;
  onImported?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [legacyData, setLegacyData] = useState<LegacyNoteData | null>(null);
  const [importing, setImporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // 已关闭过迁移提示则不再弹出
    if (localStorage.getItem(MIGRATION_DISMISSED_KEY)) return;

    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as LegacyNoteData;
      // 只在有实际内容时才提示
      if (!parsed.content?.trim()) {
        // 空草稿直接清理，不弹窗
        localStorage.removeItem(LEGACY_KEY);
        localStorage.setItem(MIGRATION_DISMISSED_KEY, '1');
        return;
      }
      setLegacyData(parsed);
      setOpen(true);
    } catch {
      // 解析失败：只提示清理，不写日志
      localStorage.removeItem(LEGACY_KEY);
      localStorage.setItem(MIGRATION_DISMISSED_KEY, '1');
    }
  }, []);

  const handleImport = async () => {
    if (!legacyData?.content) return;

    setImporting(true);
    try {
      // 先建云端文档（服务端确认后才 removeItem）
      await saveDocumentVersioned(docsId, {
        baseVersion: currentVersion,
        content: legacyData.content,
        title: '导入的本地草稿',
        requestId: `legacy-migration:${Date.now()}`,
      });

      // 服务端确认成功后才清理本地数据
      localStorage.removeItem(LEGACY_KEY);
      localStorage.setItem(MIGRATION_DISMISSED_KEY, '1');
      message.success('本地草稿已导入到云端');
      onImported?.();
    } catch {
      message.error('导入失败，请稍后重试');
      // 不清理本地数据，保留草稿
    } finally {
      setImporting(false);
      setOpen(false);
    }
  };

  const handleDelete = () => {
    localStorage.removeItem(LEGACY_KEY);
    localStorage.setItem(MIGRATION_DISMISSED_KEY, '1');
    message.success('旧草稿已删除');
    setShowDeleteConfirm(false);
    setOpen(false);
  };

  const handleDismiss = () => {
    // 用户选择稍后处理，不标记 dismissed，下次仍会提示
    setOpen(false);
  };

  return (
    <>
      <Modal
        title="检测到本地草稿"
        open={open && !showDeleteConfirm}
        closable
        maskClosable={false}
        footer={
          <Space>
            <Button onClick={handleDismiss}>稍后处理</Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => setShowDeleteConfirm(true)}
            >
              删除旧草稿
            </Button>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              loading={importing}
              onClick={handleImport}
            >
              导入当前账号
            </Button>
          </Space>
        }
      >
        <Paragraph>
          检测到浏览器中存在未同步的本地草稿
          {legacyData?.updatedAt ? `（最后编辑：${legacyData.updatedAt}）` : ''}。
        </Paragraph>
        <Text type="secondary">
          选择「导入当前账号」将把草稿内容保存为云端文档；
          选择「删除旧草稿」将永久清理本地数据。
        </Text>
      </Modal>

      <Modal
        title="确认删除"
        open={showDeleteConfirm}
        onOk={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Text>删除后本地草稿将无法恢复，确定要删除吗？</Text>
      </Modal>
    </>
  );
}
