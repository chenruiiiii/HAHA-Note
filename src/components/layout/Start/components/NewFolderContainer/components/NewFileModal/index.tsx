import React from 'react';
import FileIcon from '@/components/common/FileIcon';
import styles from './style.module.scss';
import { useRouter } from 'next/navigation';
import { useGetRepositoryListQuery } from '@/store/modules/repository';
import HASkeleton from '@/components/common/HASkeleton';
import { Repository } from '@/components/layout/Start/types/list';
import HAEmpty from '@/components/common/HAEmpty';
import { nanoid } from 'nanoid';

type RepositoryItem = {
  id: string;
  name: string;
  author: string;
  public: boolean;
  type: 'note' | 'project' | 'code' | 'growth';
};

const repositories: RepositoryItem[] = [
  {
    id: '1',
    name: '面试准备',
    author: '陈惟',
    public: false,
    type: 'note',
  },
  {
    id: '2',
    name: '项目',
    author: '陈惟',
    public: false,
    type: 'project',
  },
  {
    id: '3',
    name: 'web前端',
    author: '陈惟',
    public: true,
    type: 'code',
  },
  {
    id: '4',
    name: '进阶知识',
    author: '陈惟',
    public: true,
    type: 'growth',
  },
];

const NewFileModal = () => {
  const router = useRouter();
  const { data: repositories, isLoading, error } = useGetRepositoryListQuery();
  if (isLoading) return <HASkeleton num={3} />;
  if (error) return <div>error</div>;
  const handleNewFile = (id: string) => {
    console.log(id, '新建文件');
    const docsId = nanoid();
    window.open(`/repo-detail/${id}/${docsId}`);
  };
  if (!repositories) return <HAEmpty />;

  if (repositories) {
    return (
      <div className={styles['new-file-modal']}>
        <div className={styles['warning']}>选择一个知识库🧀</div>

        <div className={styles['repositories']}>
          {repositories.map((repo) => {
            return (
              <button
                key={repo._id}
                type="button"
                className={[styles['repository-item'], 'cursor-pointer'].join(' ')}
                onClick={() => handleNewFile(repo._id)}
              >
                <span className={styles['repo-icon-wrap']} aria-hidden="true">
                  <FileIcon type={repo.type} />
                </span>

                <div className={styles['repo-main']}>
                  <div className={styles['repo-line']}>
                    <span className={styles['repo-name']}>{repo.title}</span>
                    <span className={styles['repo-separator']}>/</span>
                    <span className={styles['repo-author']}>{repo.creator}</span>
                    <i
                      className={[
                        'iconfont',
                        repo.isPublic ? 'icon-jiesuo' : 'icon-suoding',
                        styles['repo-lock'],
                      ].join(' ')}
                    ></i>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
};

export default NewFileModal;
