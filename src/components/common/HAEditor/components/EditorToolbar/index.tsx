'use client';

import './style.scss';
import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { message, Tooltip } from 'antd';
import {
  BoldOutlined,
  CodeOutlined,
  FontSizeOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  RedoOutlined,
  UploadOutlined,
  ShareAltOutlined,
  StrikethroughOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import HAUploadFileModal from '@/components/common/HAUploadFileModal';

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

const EditorToolbar = ({ editor }: { editor: Editor }) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <>
      {contextHolder}
      <div className="ha-editor-toolbar">
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
        <ToolbarButton title="分享" onClick={() => {}}>
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
    </>
  );
};

export default EditorToolbar;
