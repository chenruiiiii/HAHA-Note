'use client';
import HASkeleton from '@/components/common/HASkeleton';
import { Divider } from 'antd';
import './style.scss';
import { useGetEditedListQuery } from '@/store/modules/user_history';
import { useEffect, useMemo, useState } from 'react';
import DocItem from '../DocItem';
import emitter from '@/lib/mitt';
import { Align, BrowseDocument, EditDocument } from '../../types/list';
import { BaseDoc } from '@/types/base';
import HAEmpty from '@/components/common/HAEmpty';

function DocList() {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [filterType, setFilterType] = useState<Align>('编辑过');

  useEffect(() => {
    const handler = (key: unknown) => {
      const alignKey = key as Align;
      setFilterType(alignKey);
    };
    emitter.on('doc-filtering', handler);
    return () => {
      emitter.off('doc-filtering', handler);
    };
  }, []);
  const { data: list, isLoading, error } = useGetEditedListQuery({ type: filterType, page, limit });

  // 缓存计算后的结果
  const renderedList = useMemo(() => {
    console.log(list, 'list---');

    if (!list) return <HAEmpty />;
    // 根据当前 filterType 状态，TS 就能区分类型了
    if (filterType === '编辑过') {
      const editedData = list as EditDocument[];
      return editedData.map((item, index) => (
        <div key={item._id} className="doc-item">
          <DocItem {...(item as any)} />
          <Divider />
        </div>
      ));
    } else {
      const browsedData = list as BrowseDocument[];
      return browsedData.map((item, index) => (
        <div key={item._id} className="doc-item">
          <DocItem {...(item as any)} />
          <Divider />
        </div>
      ));
    }
  }, [list]);
  if (isLoading) return <HASkeleton num={5}></HASkeleton>;
  else if (error) return <div>出错了...</div>;

  return <div className="doc-list">{renderedList}</div>;
}

export default DocList;
