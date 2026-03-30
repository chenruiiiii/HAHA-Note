'use client';
import styles from './style.module.scss';
import HAVirtualScroll from '@/components/common/HAVirtualScroll';
import RecommendList from '../RecommendList';
import { Tabs, TabsProps } from 'antd';
import HAEmpty from '@/components/common/HAEmpty';

const LeftStroll = () => {
  const tabs: TabsProps['items'] = [
    {
      label: '关注',
      key: 'follow',
      children: <HAEmpty />,
    },
    {
      label: '推荐',
      key: 'recommend',
      children: (
        <HAVirtualScroll>
          <RecommendList isLeft={true} />
        </HAVirtualScroll>
      ),
    },
  ];
  const onChange = (key: string) => {
    console.log(key);
  };
  return (
    <div className={styles['left-stroll']}>
      <Tabs defaultActiveKey="recommend" items={tabs} onChange={onChange} />
    </div>
  );
};

export default LeftStroll;
