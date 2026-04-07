import './style.scss';
import HASearchBox from '../HASearchBox';

const SearchTitle = () => {
  return (
    <div className="search-title">
      <HASearchBox placeholder="搜索一下" type="default" />
    </div>
  );
};

export default SearchTitle;
