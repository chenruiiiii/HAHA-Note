'use client';

import './style.scss';
import React, { useMemo, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Button, Dropdown, MenuProps, message, Tooltip } from 'antd';
import {
  BoldOutlined,
  CodeOutlined,
  DownloadOutlined,
  ExportOutlined,
  FontSizeOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  RedoOutlined,
  SaveOutlined,
  UploadOutlined,
  ShareAltOutlined,
  StrikethroughOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import HAUploadFileModal from '@/components/common/HAUploadFileModal';
import EditorShareModal from '../EditorShareModal';

const ToolbarButton = ({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => {
  return (
    <Tooltip title={title}>
      <button
        type="button"
        className={['ha-editor-toolbar-button', active ? 'is-active' : ''].join(' ')}
        onClick={onClick}
      >
        {children}
      </button>
    </Tooltip>
  );
};

const EditorToolbar = ({
  editor,
  title,
  onSave,
}: {
  editor: Editor;
  title: string;
  onSave?: () => Promise<void> | void;
}) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const shareUrl = typeof window === 'undefined' ? '' : window.location.href;
  const baseFileName = useMemo(() => {
    const normalized = title.trim().replace(/[\\/:*?"<>|]/g, '-');
    return normalized || '未命名文档';
  }, [title]);

  const downloadFile = (content: string, extension: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseFileName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportMenus: MenuProps['items'] = [
    {
      key: 'html',
      label: '导出 HTML',
      icon: <ExportOutlined />,
    },
    {
      key: 'txt',
      label: '导出 TXT',
      icon: <DownloadOutlined />,
    },
  ];

  const handleExport: MenuProps['onClick'] = ({ key }) => {
    const html = editor.getHTML();

    if (key === 'html') {
      downloadFile(html, 'html', 'text/html;charset=utf-8');
      messageApi.success('已导出 HTML');
      return;
    }

    downloadFile(editor.getText(), 'txt', 'text/plain;charset=utf-8');
    messageApi.success('已导出 TXT');
  };

  return (
    <>
      {contextHolder}
      <div className="ha-editor-toolbar">
        <Button type="primary" icon={<SaveOutlined />} onClick={() => void onSave?.()}>
          保存
        </Button>
        <Dropdown menu={{ items: exportMenus, onClick: handleExport }} trigger={['click']}>
          <Button icon={<ExportOutlined />}>导出</Button>
        </Dropdown>
        <ToolbarButton title="撤销" onClick={() => editor.chain().focus().undo().run()}>
          <UndoOutlined />
        </ToolbarButton>
        <ToolbarButton title="重做" onClick={() => editor.chain().focus().redo().run()}>
          <RedoOutlined />
        </ToolbarButton>
        <div className="ha-editor-toolbar-divider" />
        <ToolbarButton
          title="标题1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <FontSizeOutlined />
        </ToolbarButton>
        <ToolbarButton
          title="粗体"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldOutlined />
        </ToolbarButton>
        <ToolbarButton
          title="斜体"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicOutlined />
        </ToolbarButton>
        <ToolbarButton
          title="删除线"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <StrikethroughOutlined />
        </ToolbarButton>
        <div className="ha-editor-toolbar-divider" />
        <ToolbarButton
          title="无序列表"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <UnorderedListOutlined />
        </ToolbarButton>
        <ToolbarButton
          title="有序列表"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <OrderedListOutlined />
        </ToolbarButton>
        <ToolbarButton
          title="引用"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <span className="ha-editor-toolbar-text">“</span>
        </ToolbarButton>
        <ToolbarButton
          title="代码块"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <CodeOutlined />
        </ToolbarButton>
        <ToolbarButton
          title="分割线"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <span className="ha-editor-toolbar-text">-</span>
        </ToolbarButton>
        <div className="ha-editor-toolbar-divider" />
        <ToolbarButton title="上传文件" onClick={() => setIsUploadOpen(true)}>
          <UploadOutlined />
        </ToolbarButton>
        <ToolbarButton title="分享" onClick={() => setIsShareOpen(true)}>
          <ShareAltOutlined />
        </ToolbarButton>
      </div>

      <HAUploadFileModal
        open={isUploadOpen}
        onCancel={() => setIsUploadOpen(false)}
        onConfirm={(files) => {
          messageApi.success(`已选择 ${files.length} 个文件，后续可直接接上传接口`);
        }}
      />

      <EditorShareModal
        open={isShareOpen}
        onCancel={() => setIsShareOpen(false)}
        shareUrl={shareUrl}
      />
    </>
  );
};

export default EditorToolbar;
