import './style.scss';
import { Input } from 'antd';
import { SearchProps } from 'antd/es/input';
import HASearchBox from '../HASearchBox';

const SearchTitle = () => {
  const onSearch: SearchProps['onSearch'] = (value: string) => console.log(value);
  return (
    <div className="search-title">
      <HASearchBox placeholder="搜索一下" type="default" />
    </div>
  );
};

export default SearchTitle;
