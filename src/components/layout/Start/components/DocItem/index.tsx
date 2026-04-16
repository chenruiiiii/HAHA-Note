'use client';
import useDoc from '@/hooks/layer/useDoc';
import { EditDocument } from '../../types/list';
import './style.scss';
import { handleUTCTime } from '@/utils/timeFormatter';

function DocItem({ _id, title, author, updated_time, repository_name }: EditDocument) {
  const { handleToDetail } = useDoc();
  // 编辑文档信息
  const handleEdit = () => {
    console.log('编辑', _id);
  };

  return (
    <div className="f-sb cursor-pointer" onClick={() => handleToDetail(true, _id)}>
      <div className="f-left-3">
        <i className="iconfont icon-wendang" style={{ color: '#3B8EE3' }}></i>
        <div className="title">{title}</div>
        <i className="iconfont icon-bianji edit cursor-pointer" onClick={handleEdit}></i>
      </div>
      <div className="f-center-3">
        {author} / {repository_name}
      </div>
      <div className="f-right-3">{handleUTCTime(updated_time)}</div>
    </div>
  );
}

export default DocItem;
