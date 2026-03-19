import HASkeleton from '@/components/common/HASkeleton';
import { Divider } from 'antd';
import { useEffect, useState } from 'react';
import { DocListItems } from '../../types/list';
import DocItem from '../DocItem';
import './style.scss';

const list: DocListItems[] = [
  {
    type: '文档',
    title: 'string',
    creator: 'string',
    time: 'string',
    repository: 'string', // 知识库名
  },
  {
    type: '表格',
    title: 'string',
    creator: 'string',
    time: 'string',
    repository: 'string', // 知识库名
  },
  {
    type: '数据表',
    title: 'string',
    creator: 'string',
    time: 'string',
    repository: 'string', // 知识库名
  },
];

const handleLoading = (isLoading: boolean, list: DocListItems[]) => {
  if (isLoading) return <HASkeleton num={5}></HASkeleton>;
  return list.map((item, index) => (
    <div key={item.time} className="doc-item">
      <DocItem {...item}></DocItem>
      {index !== list.length - 1 && <Divider />}
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
    }, 1000);
  }, []);
  return <div className="doc-list">{handleLoading(isLoading, list)}</div>;
}

export default DocList;
