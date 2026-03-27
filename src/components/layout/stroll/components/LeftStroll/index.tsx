'use client';
import styles from './style.module.scss';
import HAVirtualScroll from '@/components/common/HAVirtualScroll';
import RecommendList from '../RecommendList';
import { Tabs, TabsProps } from 'antd';

const LeftStroll = () => {
  const tabs: TabsProps['items'] = [
    {
      label: '关注',
      key: 'follow',
      children: (
        <HAVirtualScroll>
          <RecommendList />
        </HAVirtualScroll>
      ),
    },
    {
      label: '推荐',
      key: 'recommend',
      children: (
        <HAVirtualScroll>
          <RecommendList></RecommendList>
        </HAVirtualScroll>
      ),
    },
  ];
  const onChange = (key: string) => {
    console.log(key);
  };
  return (
    <div className={styles['left-stroll']}>
      {/* <div className="title">关注、推荐</div> */}
      <Tabs defaultActiveKey="follow" items={tabs} onChange={onChange} />
    </div>
  );
};

export default LeftStroll;
