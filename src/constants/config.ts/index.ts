export const WEBSITE_INFO = {
  name: 'HAHA-Note',
  title: 'HAHA-Note - 新一代智能笔记与知识管理工具',
  description:
    'HAHA-Note 是一款现代化、智能化的笔记应用，支持 Markdown 编辑、AI 智能摘要、多设备同步、团队协作等功能。免费、安全、高效的知识管理解决方案。',
  keywords: '笔记软件,知识管理,Markdown编辑器,个人笔记,团队协作,AI笔记,知识库',
  authors: [{ name: 'HAHA-Note Team' }],
  creator: 'HAHA-Note',
  publisher: 'HAHA-Note',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://yourdomain.com'), // 替换为你的域名
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'HAHA-Note - 智能笔记与知识管理',
    description: '免费的现代化笔记应用，用 AI 提升知识管理效率',
    url: 'https://yourdomain.com',
    siteName: 'HAHA-Note',
    images: [
      {
        url: '/og-image.png', // 创建 1200x630 的 OG 图片
        width: 1200,
        height: 630,
        alt: 'HAHA-Note 预览图',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
};
