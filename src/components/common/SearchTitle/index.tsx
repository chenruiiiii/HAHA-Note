import './style.scss';
import { Input } from 'antd';
import { SearchProps } from 'antd/es/input';

const SearchTitle = () => {
  const onSearch: SearchProps['onSearch'] = (value: string) => console.log(value);
  return (
    <div className="search-title">
      <div className="search-box">
        <Input.Search placeholder="搜索一下" onSearch={onSearch} style={{ width: 200 }} />
      </div>
      {/* <Tooltip title="搜索">
        <i className="iconfont icon-icon-sousuo cursor-pointer"></i>
      </Tooltip> */}
    </div>
  );
};

export default SearchTitle;
