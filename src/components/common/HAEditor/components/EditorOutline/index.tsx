'use client';

import './style.scss';
import React from 'react';
import { HAEditorOutlineItem } from '../../../../../utils/editor';

interface EditorOutlineProps {
  items: HAEditorOutlineItem[];
}

const EditorOutline = ({ items }: EditorOutlineProps) => {
  return (
    <aside className="ha-editor-outline">
      <div className="ha-editor-outline-title">大纲</div>
      <div className="ha-editor-outline-list">
        {items.map((item, index) => (
          <a
            key={`${item.id}-${index}`}
            href={`#${item.id}`}
            className={[
              'ha-editor-outline-item',
              `level-${item.level}`,
              index === 0 ? 'is-active' : '',
            ].join(' ')}
          >
            {item.text}
          </a>
        ))}
      </div>
    </aside>
  );
};

export default EditorOutline;
