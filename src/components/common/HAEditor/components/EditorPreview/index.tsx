'use client';

import './style.scss';
import React, { useMemo } from 'react';
import EditorOutline from '../EditorOutline';
import { getOutlineFromHtml, injectHeadingIds } from '../../../../../utils/editor';

interface EditorPreviewProps {
  title?: string;
  content?: string;
  showOutline?: boolean;
}

const EditorPreview = ({
  title = '文档标题',
  content = '',
  showOutline = true,
}: EditorPreviewProps) => {
  const normalizedHtml = useMemo(() => injectHeadingIds(content), [content]);
  const outlineItems = useMemo(() => getOutlineFromHtml(normalizedHtml), [normalizedHtml]);

  return (
    <div className="ha-editor ha-editor-preview-mode">
      <div className="ha-editor-shell">
        <div className="ha-editor-main">
          <div className="ha-editor-document">
            <div className="ha-editor-page">
              <div className="ha-editor-page-title">{title}</div>
              <div
                className="ha-editor-preview-content"
                dangerouslySetInnerHTML={{ __html: normalizedHtml }}
              />
            </div>
          </div>
        </div>

        {showOutline && <EditorOutline items={outlineItems} />}
      </div>
    </div>
  );
};

export default EditorPreview;
