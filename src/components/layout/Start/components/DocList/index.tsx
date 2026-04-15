'use client';
import HASkeleton from '@/components/common/HASkeleton';
import { Divider } from 'antd';
import { EditDocument, Repository } from '../../types/list';
import './style.scss';
import { useGetEditedListQuery } from '@/store/modules/user_history';
import { useState } from 'react';
import DocItem from '../DocItem';

const list: Repository[] = [
  {
    _id: '1',
    type: '文档',
    title: 'string',
    creator: 'string',
    time: 'string',
    repository: 'string', // 知识库名
    docs_list: [{ docs_name: '色彩系统设计指南', docs_id: 'D_q1w2e3r4t5' }],
  },
  {
    _id: '2',
    type: '表格',
    title: 'string',
    creator: 'string',
    time: 'string',
    repository: 'string', // 知识库名
    docs_list: [{ docs_name: '色彩系统设计指南', docs_id: 'D_q1w2e3r4t5' }],
  },
  {
    _id: '3',
    type: '数据表',
    title: 'string',
    creator: 'string',
    time: 'string',
    repository: 'string', // 知识库名
    docs_list: [{ docs_name: '色彩系统设计指南', docs_id: 'D_q1w2e3r4t5' }],
  },
];

const handleLoading = (list: EditDocument[]) => {
  return list.map((item, index) => (
    <div key={item._id} className="doc-item">
      <DocItem {...item} />
      <Divider />
    </div>
  ));
};
function DocList() {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const { data: list, isLoading, error } = useGetEditedListQuery({ page, limit });
  if (isLoading) return <HASkeleton num={5}></HASkeleton>;
  else if (error) return <div>出错了...</div>;
  else if (!list) return <div>没有数据</div>;

  return <div className="doc-list">{handleLoading(list)}</div>;
}

export default DocList;
