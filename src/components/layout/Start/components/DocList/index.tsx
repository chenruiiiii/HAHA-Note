'use client';
import HASkeleton from '@/components/common/HASkeleton';
import { Divider } from 'antd';
import { useEffect, useState } from 'react';
import { DocListItems } from '../../types/list';
import DocItem from '../DocItem';
import './style.scss';
import useDoc from '@/hooks/layer/useDoc';

const list: DocListItems[] = [
  {
    id: '1',
    type: '文档',
    title: 'string',
    creator: 'string',
    time: 'string',
    repository: 'string', // 知识库名
  },
  {
    id: '2',
    type: '表格',
    title: 'string',
    creator: 'string',
    time: 'string',
    repository: 'string', // 知识库名
  },
  {
    id: '3',
    type: '数据表',
    title: 'string',
    creator: 'string',
    time: 'string',
    repository: 'string', // 知识库名
  },
];

const handleLoading = (isLoading: boolean, list: DocListItems[]) => {
  const { handleToDetail } = useDoc();
  if (isLoading) return <HASkeleton num={5}></HASkeleton>;
  return list.map((item, index) => (
    <div key={item.id} className="doc-item">
      <DocItem {...item} />
      <Divider />
    </div>
  ));
};
function DocList() {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // 获取数据
    // ...
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);
  return <div className="doc-list">{handleLoading(isLoading, list)}</div>;
}

export default DocList;
