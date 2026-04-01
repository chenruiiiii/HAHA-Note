import React, { KeyboardEvent, useState } from 'react';
import './style.scss';
import { Input } from 'antd';

type SearchType = 'default' | 'primary' | 'danger' | 'warning' | 'success';

interface HASearchBoxProps {
  placeholder?: string;
  type?: SearchType;
}

const HASearchBox = ({ placeholder = '搜索一下', type = 'default' }) => {
  const [searchValue, setSearchValue] = useState<string>('');
  // 搜索统一处理函数
  const handleSearch = () => {
    //
  };

  // enter键触发搜索事件，父组件通过事件监听获取输入值并处理搜索逻辑
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // handleSearch(e.currentTarget.value);
    }
  };

  const searchIcon = (
    <i className="iconfont icon-sousuo" style={{ paddingRight: '10px' }} onClick={handleSearch}></i>
  );

  return (
    <div className="ha-search-box">
      <Input
        prefix={searchIcon}
        placeholder="请输入搜索内容"
        style={{ backgroundColor: '#F2F3F4' }}
        onKeyDown={handleKeyDown}
        value={searchValue}
      />
    </div>
  );
};

export default HASearchBox;
