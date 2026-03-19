import { DocListItems } from '../../types/list';
import './style.scss';

const handleIcon = (type: string) => {
  switch (type) {
    case '文档':
      return <i className="iconfont icon-wendang" style={{ color: '#3B8EE3' }}></i>;
    case '表格':
      return <i className="iconfont icon-biaoge" style={{ color: '#ECB604' }}></i>;
    case '画板':
      return <i className="iconfont icon-xinjianhuaban" style={{ color: '#3CCA8E' }}></i>;
    case '数据表':
      return <i className="iconfont icon-shujubiao" style={{ color: '#9177D9' }}></i>;
    default:
      return <i className="iconfont icon-wendang" style={{ color: '#3B8EE3' }}></i>;
  }
};
function DocItem({ type, title, creator, time, repository }: DocListItems) {
  return (
    <div className="f-sb">
      <div className="f-left-3">
        {handleIcon(type)}
        <div className="title">{title}</div>
      </div>
      <div className="f-center-3">
        {creator} / {repository}
      </div>
      <div className="f-right-3">{time}</div>
    </div>
  );
}

export default DocItem;
