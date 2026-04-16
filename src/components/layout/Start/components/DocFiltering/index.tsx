'use client';
import { Segmented } from 'antd';
import { useState } from 'react';
import './style.scss';
import emitter from '@/lib/mitt';
import { Align } from '../../types/list';

const options = ['编辑过', '浏览过'];

function DocFiltering() {
  const handleTabClick = (key: Align) => {
    emitter.emit('doc-filtering', key);
    console.log('切换', key);
  };

  return (
    <div className="f-sb">
      <div className="f-left">
        <Segmented<String>
          style={{ marginBottom: 8 }}
          onChange={(value) => handleTabClick(value as Align)}
          options={options}
        />
      </div>
    </div>
  );
}

export default DocFiltering;
