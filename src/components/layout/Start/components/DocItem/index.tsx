'use client';
import useDoc from '@/hooks/layer/useDoc';
import { Repository } from '../../types/list';
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
function DocItem({ _id, type, title, creator, time, repository }: Repository) {
  const { handleToDetail } = useDoc();
  // 编辑文档信息
  const handleEdit = () => {
    console.log('编辑', _id);
  };

  return (
    <div className="f-sb cursor-pointer" onClick={() => handleToDetail(true, _id)}>
      <div className="f-left-3">
        {handleIcon(type)}
        <div className="title">{title}</div>
        <i className="iconfont icon-bianji edit cursor-pointer" onClick={handleEdit}></i>
      </div>
      <div className="f-center-3">
        {creator} / {repository}
      </div>
      <div className="f-right-3">{time}</div>
    </div>
  );
}

export default DocItem;
