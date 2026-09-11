import React, { useState } from 'react';
import FileIcon from '@/components/common/FileIcon';
import styles from './style.module.scss';
import { useRouter } from 'next/navigation';
import { useGetRepositoryListQuery } from '@/store/modules/repository';
import HASkeleton from '@/components/common/HASkeleton';
import HAEmpty from '@/components/common/HAEmpty';
import { nanoid } from 'nanoid';
import { message } from 'antd';
import { createDocsDetailData } from '@/services/docs-detail';
import { useAppDispatch } from '@/store';
import { invalidateDocumentLists } from '@/store/invalidate';

const NewFileModal = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const [creatingRepositoryId, setCreatingRepositoryId] = useState<string>();
  const { data: repositories, isLoading, error } = useGetRepositoryListQuery();
  if (isLoading) return <HASkeleton num={3} />;
  if (error) return <div>error</div>;

  const handleNewFile = async (id: string) => {
    const newWindow = window.open('about:blank', '_blank');
    const docsId = nanoid();

    try {
      setCreatingRepositoryId(id);
      const response = await createDocsDetailData(docsId, id);

      if (response.code !== 200) {
        throw new Error(response.message || '新建文档失败');
      }

      invalidateDocumentLists(dispatch);

      const targetUrl = `/repo-detail/${id}/${docsId}`;
      if (newWindow) {
        newWindow.opener = null;
        newWindow.location.href = targetUrl;
      } else {
        router.push(targetUrl);
      }
    } catch (createError) {
      newWindow?.close();
      messageApi.error(createError instanceof Error ? createError.message : '新建文档失败');
    } finally {
      setCreatingRepositoryId(undefined);
    }
  };
  if (!repositories) return <HAEmpty />;

  if (repositories) {
    return (
      <div className={styles['new-file-modal']}>
        {contextHolder}
        <div className={styles['warning']}>选择一个知识库🧀</div>

        <div className={styles['repositories']}>
          {repositories.map((repo) => {
            return (
              <button
                key={repo._id}
                type="button"
                className={[styles['repository-item'], 'cursor-pointer'].join(' ')}
                onClick={() => handleNewFile(repo._id)}
                disabled={Boolean(creatingRepositoryId)}
              >
                <span className={styles['repo-icon-wrap']} aria-hidden="true">
                  <FileIcon type={repo.type} />
                </span>

                <div className={styles['repo-main']}>
                  <div className={styles['repo-line']}>
                    <span className={styles['repo-name']}>{repo.title}</span>
                    {creatingRepositoryId === repo._id && (
                      <span className={styles['repo-author']}>创建中...</span>
                    )}
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
