import { FILTER_INFO } from '@/constants/config.ts/start';
import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Segmented, Space } from 'antd';
import { useState } from 'react';
import './style.scss';

type Align = '编辑过' | '浏览过' | '我点赞的' | '我评论过';

function DocFiltering() {
  const [alignValue, setAlignValue] = useState<Align>('编辑过');
  const handleTabClick = (key: Align) => {
    setAlignValue(key);
  };
  return (
    <div className="f-sb">
      <div className="f-left">
        <Segmented
          value={alignValue}
          style={{ marginBottom: 8 }}
          onChange={() => handleTabClick(alignValue)}
          options={['编辑过', '浏览过', '我点赞的', '我评论过']}
        />
      </div>
      <div className="f-right">
        {FILTER_INFO.map(({ label, options }) => (
          <div className="select cursor-pointer">
            <Dropdown menu={{ items: options }}>
              <Space>
                {label}
                <DownOutlined />
              </Space>
            </Dropdown>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DocFiltering;
