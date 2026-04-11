'use client';
import { Segmented } from 'antd';
import { useState } from 'react';
import './style.scss';

type Align = '编辑过' | '浏览过';

const options = ['编辑过', '浏览过'];

function DocFiltering() {
  const [alignValue, setAlignValue] = useState<Align>('编辑过');
  const handleTabClick = (key: Align) => {
    setAlignValue(key);
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
