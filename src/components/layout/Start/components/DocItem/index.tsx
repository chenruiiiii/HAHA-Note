'use client';
import { useRouter } from 'next/navigation';
import { EditDocument } from '../../types/list';
import './style.scss';
import { handleUTCTime } from '@/utils/timeFormatter';

function DocItem({ _id, repository_id, docs_id, title, author, updated_time, repository_name }: EditDocument) {
  const router = useRouter();

  // 活动条目 = 私有工作区文档：优先进文档详情，缺 docs_id 降级知识库首页，
  // 两者皆缺（历史脏数据）不跳转，绝不落入公开笔记 404。
  const handleNavigate = () => {
    if (repository_id && docs_id) {
      router.push(`/repo-detail/${repository_id}/${docs_id}`);
      return;
    }
    if (repository_id) {
      router.push(`/repo-detail/${repository_id}/home`);
    }
  };

  // 编辑文档信息
  const handleEdit = () => {
    console.log('编辑', _id);
  };

  return (
    <div className="f-sb cursor-pointer" onClick={handleNavigate}>
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
