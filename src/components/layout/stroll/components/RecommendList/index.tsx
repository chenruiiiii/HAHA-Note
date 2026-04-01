import React from 'react';
import { Fragment } from 'react';
import styles from './style.module.scss';
import LeftRecommendItem from '../LeftRecommendItem';
import { Divider } from 'antd';
import RightRecommendItem from '../RightRecommendItem';
import { handleEmpty } from '@/utils/empty';
import { leftRecommendData, rightRecommendData } from '../../data';

interface RecommendListProps {
  isLeft: boolean;
}

const RecommendList = ({ isLeft }: RecommendListProps) => {
  const left_items = leftRecommendData.map((item, index) => (
    <Fragment key={item.id}>
      <LeftRecommendItem {...item} />
      {index !== leftRecommendData.length - 1 && <Divider size="small" />}
    </Fragment>
  ));

  const right_items = rightRecommendData.map((item) => <RightRecommendItem key={item.id} {...item} />);

  return (
    <div className={styles['recommend-list']}>
      {isLeft
        ? handleEmpty(leftRecommendData, left_items)
        : handleEmpty(rightRecommendData, right_items)}
    </div>
  );
};

export default RecommendList;
