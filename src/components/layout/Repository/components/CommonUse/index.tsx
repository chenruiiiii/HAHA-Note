'use client';

import React from 'react';
import styles from './style.module.scss';
import FileIcon from '@/components/common/FileIcon';
import { useGetRepositoryListQuery } from '@/store/modules/repository';
import HASkeleton from '@/components/common/HASkeleton';
import HAEmpty from '@/components/common/HAEmpty';
import Link from 'next/link';

const CommonUse = () => {
  const { data: repositories = [], isLoading, error } = useGetRepositoryListQuery();
  const list = repositories.slice(0, 5);

  if (isLoading) return <HASkeleton num={3} />;
  if (error) return <HAEmpty />;
  if (!list.length) return <HAEmpty />;

  return (
    <div className={styles['common-use']}>
      <div className={styles['title']}>常用</div>
      <div className={styles['list']}>
        {list.map((item) => {
          return (
            <Link
              href={`/repo-detail/${item._id}/home`}
              className={styles['list-item']}
              key={item._id}
            >
              <FileIcon type={item.type} />
              <div className={styles['name']}>
                {item.title}
                <i
                  className={[
                    'iconfont',
                    item.isPublic ? 'icon-jiesuo' : 'icon-suoding',
                  ].join(' ')}
                ></i>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CommonUse;
