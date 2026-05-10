'use client';
import HASkeleton from '@/components/common/HASkeleton';
import HAVirtualScroll from '@/components/common/HAVirtualScroll';
import { Divider } from 'antd';
import './style.scss';
import { useGetEditedListQuery } from '@/store/modules/user_history';
import { useEffect, useMemo, useState } from 'react';
import DocItem from '../DocItem';
import emitter from '@/lib/mitt';
import { Align, BrowseDocument, EditDocument } from '../../types/list';
import HAEmpty from '@/components/common/HAEmpty';

const DOC_ROW_HEIGHT = 76;

function DocList() {
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
  const { data: list, isLoading, error } = useGetEditedListQuery({ type: filterType });

  const items = useMemo(() => {
    if (!list) {
      return [];
    }

    return filterType === '编辑过' ? (list as EditDocument[]) : (list as BrowseDocument[]);
  }, [filterType, list]);

  if (isLoading) return <HASkeleton num={5}></HASkeleton>;
  else if (error) return <div>出错了...</div>;

  return (
    <div className="doc-list">
      <HAVirtualScroll
        items={items}
        itemHeight={DOC_ROW_HEIGHT}
        itemKey={(item) => item._id}
        empty={<HAEmpty />}
        renderItem={(item) => (
          <div className="doc-item">
            <DocItem {...item} />
            <Divider />
          </div>
        )}
      />
    </div>
  );
}

export default DocList;
