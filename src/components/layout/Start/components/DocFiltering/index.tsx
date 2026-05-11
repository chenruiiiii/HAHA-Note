'use client';
import { Segmented } from 'antd';
import './style.scss';
import emitter from '@/lib/mitt';
import { Align } from '../../types/list';

const options = ['编辑过', '浏览过'];

interface DocFilteringProps {
  value?: Align;
  onChange?: (value: Align) => void;
}

function DocFiltering({ value, onChange }: DocFilteringProps) {
  const handleTabClick = (key: Align) => {
    onChange?.(key);
    if (!onChange) {
      emitter.emit('doc-filtering', key);
    }
    console.log('切换', key);
  };

  return (
    <div className="f-sb">
      <div className="f-left">
        <Segmented<string>
          style={{ marginBottom: 8 }}
          value={value}
          onChange={(value) => handleTabClick(value as Align)}
          options={options}
        />
      </div>
    </div>
  );
}

export default DocFiltering;
