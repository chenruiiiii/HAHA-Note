'use client';
import HAVirtualScroll from '@/components/common/HAVirtualScroll';
import HAEmpty from '@/components/common/HAEmpty';
import { Fragment, useEffect } from 'react';
import styles from './style.module.scss';
import LeftRecommendItem from '../LeftRecommendItem';
import { Divider } from 'antd';
import RightRecommendItem from '../RightRecommendItem';
import { handleEmpty } from '@/utils/empty';
import { useRecommendList } from '../../hooks/useRecommendList';
import HASkeleton from '@/components/common/HASkeleton';

interface RecommendListProps {
  isLeft: boolean;
}

const LEFT_RECOMMEND_ROW_HEIGHT = 206;

const RecommendList = ({ isLeft }: RecommendListProps) => {
  const { isLoading, loadData, list } = useRecommendList();

  const right_items = list
    .slice(0, 3)
    .map((item) => <RightRecommendItem key={item._id} {...item} />);

  useEffect(() => {
    loadData();
  }, [loadData]);
  if (isLoading) return <HASkeleton num={isLeft ? 5 : 3} />;

  return (
    <div className={styles['recommend-list']}>
      {isLeft ? (
        <HAVirtualScroll
          items={list}
          itemHeight={LEFT_RECOMMEND_ROW_HEIGHT}
          itemKey={(item) => item._id}
          empty={<HAEmpty />}
          renderItem={(item, index) => (
            <Fragment key={item._id}>
              <LeftRecommendItem {...item} />
              {index !== list.length - 1 && <Divider size="small" />}
            </Fragment>
          )}
        />
      ) : (
        handleEmpty(list.slice(0, 3), right_items)
      )}
    </div>
  );
};

export default RecommendList;
