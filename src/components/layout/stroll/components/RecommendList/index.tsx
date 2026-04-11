'use client';
import { Fragment, useEffect, useState } from 'react';
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

const RecommendList = ({ isLeft }: RecommendListProps) => {
  const { isLoading, loadData, error, list } = useRecommendList(isLeft);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const left_items =
    list &&
    list.map((item, index) => (
      <Fragment key={item._id}>
        <LeftRecommendItem {...item} />
        {index !== list.length - 1 && <Divider size="small" />}
      </Fragment>
    ));

  const right_items = list
    .slice(0, 3)
    .map((item) => <RightRecommendItem key={item._id} {...item} />);

  useEffect(() => {
    loadData(page, limit);
  }, []);
  if (isLoading) return <HASkeleton num={isLeft ? 5 : 3} />;

  return (
    <div className={styles['recommend-list']}>
      {isLeft ? handleEmpty(list, left_items) : handleEmpty(list.slice(0, 3), right_items)}
    </div>
  );
};

export default RecommendList;
