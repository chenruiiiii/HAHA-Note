import React, { KeyboardEvent, useState } from 'react';
import './style.scss';
import { Input } from 'antd';

type SearchType = 'default' | 'primary' | 'danger' | 'warning' | 'success';

interface HASearchBoxProps {
  placeholder?: string;
  type?: SearchType;
}

const HASearchBox = ({ placeholder = '搜索一下', type = 'default' }: HASearchBoxProps) => {
  const [searchValue, setSearchValue] = useState<string>('');
  // 搜索统一处理函数
  const handleSearch = () => {
    // 根据type类型处理搜索逻辑
  };

  // 搜索框输入值变化事件
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  // enter键触发搜索事件，父组件通过事件监听获取输入值并处理搜索逻辑
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const searchIcon = (
    <i className="iconfont icon-sousuo" style={{ paddingRight: '10px' }} onClick={handleSearch}></i>
  );

  return (
    <div className="ha-search-box">
      <Input
        prefix={searchIcon}
        placeholder={placeholder}
        style={{ backgroundColor: '#F2F3F4' }}
        onKeyDown={handleKeyDown}
        value={searchValue}
        onChange={(e) => handleSearchChange(e)}
      />
    </div>
  );
};

export default HASearchBox;
