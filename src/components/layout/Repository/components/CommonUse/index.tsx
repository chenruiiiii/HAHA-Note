import React from 'react';
import styles from './style.module.scss';
import FileIcon from '@/components/common/FileIcon';

const CommonUse = () => {
  const list = [
    {
      name: '常用1',
      public: true,
    },
    {
      name: '常用2',
      public: true,
    },
    {
      name: '常用3',
      public: false,
    },
    {
      name: '常用4',
      public: true,
    },
    {
      name: '常用5',
      public: true,
    },
  ];
  return (
    <div className={styles['common-use']}>
      <div className={styles['title']}>常用</div>
      <div className={styles['list']}>
        {list.map((item) => {
          return (
            <div className={styles['list-item']} key={item.name}>
              <FileIcon file_name={item.name} />
              <div className={styles['name']}>
                {item.name}
                <i
                  className={['iconfont', item.public ? 'icon-jiesuo' : 'icon-suoding'].join(' ')}
                ></i>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommonUse;
