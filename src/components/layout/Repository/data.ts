import { RepoDetailType } from './types';

export const repoDetailMock: RepoDetailType = {
  name: 'web前端',
  isPublic: true,
  description: '前端学习与知识沉淀',
  word_count: 7429,
  update_time: '2024-06-01 12:00',
  owner: 'owner',
  avatar: ['https://avatars.githubusercontent.com/u/1024025?v=4'],
  repo_list: [
    { id: '1', name: '蓝桥杯刷题心得', update_time: '2025-12-13 20:30' },
    { id: '2', name: '数组和对象常用方法', update_time: '2025-04-08 20:04' },
    { id: '3', name: '节流和防抖', update_time: '2025-05-26 21:09' },
    { id: '4', name: 'SEO优化', update_time: '2024-10-26 11:01' },
    { id: '5', name: '路由模式', update_time: '2024-10-26 11:33' },
    { id: '6', name: 'less', update_time: '2024-10-22 10:14' },
    { id: '7', name: '好用的工具', update_time: '2025-09-06 15:21' },
    { id: '8', name: 'CSS--浮动', update_time: '2023-12-16 22:08' },
    { id: '9', name: 'CSS-盒子模型、圆角边框、盒子阴影', update_time: '2023-12-16 15:59' },
    { id: '10', name: 'CSS-三大特性', update_time: '2024-08-12 09:10' },
    { id: '11', name: 'CSS-复合选择器、元素显示模式、背景', update_time: '2023-12-16 10:22' },
    {
      id: '12',
      name: 'CSS-基本选择器、字体/文本属性、引入方式',
      update_time: '2023-12-10 10:08',
    },
    { id: '13', name: 'HTML标签', update_time: '2024-08-12 08:53' },
  ],
  collect: true,
  file_desc_title: '欢迎来到知识库',
  file_desc: '知识库就像书一样，让多篇文档结构化，方便知识的创作与沉淀',
};
