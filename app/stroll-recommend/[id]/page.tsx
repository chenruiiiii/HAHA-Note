import { notFound } from 'next/navigation';
import React from 'react';
import FileDetail from '@/components/layout/Stroll/components/FileDetail';
import { RecommendDetailType } from '@/components/layout/Stroll/types/recommend';

const StrollRecommend = async ({ params: { id } }: { params: { id: string } }) => {
  const detail: RecommendDetailType = {
    _id: '65a3b2c1d4e5f67890ab1234',
    source: {
      platform: 'yuque',
      title: '语雀技术专栏',
      avatar: 'https://example.com/avatars/yuque-logo.png',
    },
    author: {
      name: '张小明',
      avatar: 'https://example.com/avatars/zhangxiaoming.jpg',
    },
    title_html: '<h1>深入理解 TypeScript 泛型</h1>',
    description_html:
      '<p>本文详细介绍了 TypeScript 中泛型的使用场景、语法规则以及最佳实践，帮助你写出更灵活的代码。</p>',
    content_html:
      '<h2>什么是泛型</h2><p>泛型允许我们在定义函数、类或接口时，不预先指定具体的类型，而是在使用时再指定类型的特性。</p><h2>基本用法</h2><pre><code>function identity&lt;T&gt;(arg: T): T {\n  return arg;\n}</code></pre><h2>总结</h2><p>掌握泛型可以大大提升代码的复用性和类型安全性。</p>',
    quality_level: 'featured',
    like_count: 342,
    comment_count: 56,
    word_count: 2847,
    source_url: 'https://www.yuque.com/tech/ts-generics',
  };

  if (!detail) {
    notFound();
  }

  return <FileDetail detail={detail} />;
};

export default StrollRecommend;
