'use client';

import './style.scss';
import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { CommentOutlined, EyeOutlined } from '@ant-design/icons';

interface EditorHeaderProps {
  title: string;
  titlePlaceholder: string;
  saveStatusText: string;
  onTitleChange: (title: string) => void;
  onTitleSubmit: (title: string) => void;
}

const EditorHeader = ({
  title,
  titlePlaceholder,
  saveStatusText,
  onTitleChange,
  onTitleSubmit,
}: EditorHeaderProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const handleLikeClick = () => {
    console.log('like');
  };
  return (
    <header className="ha-editor-header">
      <div className="ha-editor-header-left">
        <input
          value={title}
          placeholder={titlePlaceholder}
          maxLength={30}
          className="ha-editor-title-input"
          onChange={(event) => onTitleChange(event.target.value)}
          onBlur={(event) => onTitleSubmit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onTitleSubmit(event.currentTarget.value);
              event.currentTarget.blur();
            }
          }}
        />
        <div className="ha-editor-save-status">
          <i className="iconfont icon-suoding"></i>
          <span>{saveStatusText}</span>
        </div>
      </div>

      <div className="ha-editor-header-right">
        <Tooltip title="收藏">
          <button type="button" className="ha-editor-header-icon" onClick={handleLikeClick}>
            {isLiked ? (
              <i className="iconfont icon-shoucang-yishoucang" style={{ color: '#FE9461' }}></i>
            ) : (
              <i className="iconfont icon-shoucang2"></i>
            )}
          </button>
        </Tooltip>
        <Tooltip title="评论">
          <button type="button" className="ha-editor-header-icon">
            <CommentOutlined />
          </button>
        </Tooltip>
        <Button className="ha-editor-header-action">分享</Button>
        <Button className="ha-editor-header-action">更新</Button>
      </div>
    </header>
  );
};

export default EditorHeader;
