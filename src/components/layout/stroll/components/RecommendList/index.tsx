'use client';
import { Fragment, useEffect, useState } from 'react';
import styles from './style.module.scss';
import LeftRecommendItem from '../LeftRecommendItem';
import { Divider } from 'antd';
import RightRecommendItem from '../RightRecommendItem';
import { handleEmpty } from '@/utils/empty';
import { leftRecommendData, rightRecommendData } from '../../data';
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
        {index !== leftRecommendData.length - 1 && <Divider size="small" />}
      </Fragment>
    ));

  const right_items = rightRecommendData.map((item) => (
    <RightRecommendItem key={item.id} {...item} />
  ));

  useEffect(() => {
    loadData(page, limit);
  }, []);
  if (isLoading) return <HASkeleton num={isLeft ? 5 : 3} />;

  return (
    <div className={styles['recommend-list']}>
      {isLeft
        ? handleEmpty(leftRecommendData, left_items)
        : handleEmpty(rightRecommendData, right_items)}
    </div>
  );
};

export default RecommendList;
