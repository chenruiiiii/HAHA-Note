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
type DocumentList = EditDocument[] | BrowseDocument[];

interface DocListProps {
  filterType?: Align;
  list?: DocumentList;
  isLoading?: boolean;
  error?: unknown;
}

function DocList({
  filterType: controlledFilterType,
  list: controlledList,
  isLoading: controlledIsLoading,
  error: controlledError,
}: DocListProps) {
  const [internalFilterType, setInternalFilterType] = useState<Align>('编辑过');
  const filterType = controlledFilterType ?? internalFilterType;
  const hasControlledQuery =
    controlledList !== undefined || controlledIsLoading !== undefined || controlledError !== undefined;

  useEffect(() => {
    if (controlledFilterType) {
      return;
    }

    const handler = (key: unknown) => {
      const alignKey = key as Align;
      setInternalFilterType(alignKey);
    };
    emitter.on('doc-filtering', handler);
    return () => {
      emitter.off('doc-filtering', handler);
    };
  }, [controlledFilterType]);
  const queryResult = useGetEditedListQuery({ type: filterType }, { skip: hasControlledQuery });

  const list = controlledList ?? queryResult.data;
  const isLoading = controlledIsLoading ?? queryResult.isLoading;
  const error = controlledError ?? queryResult.error;

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
