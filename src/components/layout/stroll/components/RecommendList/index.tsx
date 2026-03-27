import React from 'react';
import styles from './style.module.scss';
import { LeftRecommendItemType, RightRecommendItemType } from '../../types/recommend';
import LeftRecommendItem from '../LeftRecommendItem';
import { Divider } from 'antd';
import RightRecommendItem from '../RightRecommendItem';

interface RecommendListProps {
  isLeft: boolean;
}

const RecommendList = ({ isLeft }: RecommendListProps) => {
  const leftRecommendData: LeftRecommendItemType[] = [
    {
      id: '1',
      user: {
        username: 'haha-note',
        // 如果 HAAvatar 没有传图片，可能需要根据用户名生成默认头像
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=haha-note`,
      },
      content: {
        title: '语雀专业会员支持试用MCP',
        description:
          '语雀 API Token 功能现已向专业会员开放！之前只有超级会员才能使用的 Token 功能，现在专业会员也可以体验了。使用方式专业会员可以在语雀设置页面获取 API Token，用于连接各种 AI 工具和第三方应用。获取地址：语雀 Token 设置页面试用额度：每天 50 次 API 调用...',
        image:
          'https://cdn.nlark.com/yuque/0/2023/png/29609/1689529079649-f7f7f7f7-f7f7f7f7-f7f7f7f7-f7f7f7f7-f7f7f7f7.png',
      },
      likNum: 10,
      detail_url: 'https://www.yuque.com/haha-note/api-token',
    },
    {
      id: '1',
      user: {
        username: 'haha-note',
        // 如果 HAAvatar 没有传图片，可能需要根据用户名生成默认头像
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=haha-note`,
      },
      content: {
        title: '语雀专业会员支持试用MCP',
        description:
          '语雀 API Token 功能现已向专业会员开放！之前只有超级会员才能使用的 Token 功能，现在专业会员也可以体验了。使用方式专业会员可以在语雀设置页面获取 API Token，用于连接各种 AI 工具和第三方应用。获取地址：语雀 Token 设置页面试用额度：每天 50 次 API 调用...',
        image:
          'https://cdn.nlark.com/yuque/0/2023/png/29609/1689529079649-f7f7f7f7-f7f7f7f7-f7f7f7f7-f7f7f7f7-f7f7f7f7.png',
      },
      likNum: 10,
      detail_url: 'https://www.yuque.com/haha-note/api-token',
    },
    {
      id: '1',
      user: {
        username: 'haha-note',
        // 如果 HAAvatar 没有传图片，可能需要根据用户名生成默认头像
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=haha-note`,
      },
      content: {
        title: '语雀专业会员支持试用MCP',
        description:
          '语雀 API Token 功能现已向专业会员开放！之前只有超级会员才能使用的 Token 功能，现在专业会员也可以体验了。使用方式专业会员可以在语雀设置页面获取 API Token，用于连接各种 AI 工具和第三方应用。获取地址：语雀 Token 设置页面试用额度：每天 50 次 API 调用...',
        image:
          'https://cdn.nlark.com/yuque/0/2023/png/29609/1689529079649-f7f7f7f7-f7f7f7f7-f7f7f7f7-f7f7f7f7-f7f7f7f7.png',
      },
      likNum: 10,
      detail_url: 'https://www.yuque.com/haha-note/api-token',
    },
  ];
  const rightRecommendData: RightRecommendItemType[] = [
    {
      id: 'rec_001',
      user: {
        username: '语雀官方',
        signature: '知识创作与分享工具',
        avatar:
          'https://cdn.nlark.com/yuque/0/2023/png/29609/1689529079649-f7f7f7f7-f7f7f7f7-f7f7f7f7-f7f7f7f7-f7f7f7f7.png',
      },
      recommend_title: '语雀专业会员支持试用MCP',
    },
    {
      id: 'rec_002',
      user: {
        username: '前端小课',
        signature: '每日一篇前端好文',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=frontend',
      },
      recommend_title: 'Next.js 15 新特性：Server Actions 全面升级',
    },
    {
      id: 'rec_003',
      user: {
        username: '设计日记',
        signature: '设计干货分享',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=design',
      },
      recommend_title: 'Figma 2026 新功能：AI 辅助设计系统',
    },
  ];

  const left_items = leftRecommendData.map((item, index) => (
    <>
      <LeftRecommendItem key={item.id} {...item} />
      {index !== leftRecommendData.length - 1 && <Divider size="small" />}
    </>
  ));

  const right_items = rightRecommendData.map((item, index) => (
    <>
      <RightRecommendItem key={item.id} {...item} />
    </>
  ));

  return <div className={styles['recommend-list']}>{isLeft ? left_items : right_items}</div>;
};

export default RecommendList;
