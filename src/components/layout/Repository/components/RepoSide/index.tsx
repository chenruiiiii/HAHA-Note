'use client';
import logoImg from '@/assets/images/logo.png';
import { Tooltip } from 'antd';
import styles from './style.module.scss';
import { RepoDetailType } from '../../types';
import { useParams, useRouter } from 'next/navigation';
import HABack from '@/components/common/HABack';

const mainMenuList = [
  {
    key: 'home',
    label: '首页',
    type: 'home' as const,
    active: true,
  },
  {
    key: 'directory',
    label: '目录',
    type: 'directory' as const,
    active: false,
  },
];

const RepoSide = ({ name, repo_list, avatar }: RepoDetailType) => {
  const router = useRouter();
  const params = useParams();
  const repoId = params.repoId as string;

  // 详细文档内容跳转
  const handleToDetail = (id: string) => {
    router.push(`/repo-detail/${repoId}/${id}`);
  };

  const handleToHome = (isHome: boolean) => {
    if (isHome) {
      router.push(`/repo-detail/${repoId}/home`);
    } else {
      router.push('/repository');
    }
  };

  return (
    <aside className={styles['repo-aside']}>
      <div className={styles['repo-header']}>
        <div className={styles['repo-header-main']}>
          <img className={styles['repo-logo']} src={logoImg.src} alt="logo" />
          <div className={styles['repo-title-group']}>
            <HABack onClick={() => handleToHome(false)}>
              <div className={[styles['repo-owner']].join(' ')}>个人知识库</div>
            </HABack>
            <div className={styles['repo-title-row']}>
              <span className={[styles['repo-title'], 'cursor-pointer'].join(' ')}>{name}</span>
            </div>
          </div>
        </div>
        <Tooltip title="更多操作">
          <button type="button" className={styles['ghost-action']} aria-label="更多操作">
            <i className="iconfont icon-gengduo"></i>
          </button>
        </Tooltip>
      </div>

      <nav className={styles['menu-group']} aria-label="仓库导航">
        {mainMenuList.map((item) => (
          <div
            key={item.key}
            className={['cursor-pointer', styles['menu-item'], styles['menu-item-active']].join(
              ' '
            )}
            onClick={() => handleToHome(true)}
          >
            {item.type === 'home' && (
              <Tooltip title="首页">
                <i className="iconfont icon-shouye" />
              </Tooltip>
            )}
            {item.type === 'directory' && (
              <Tooltip title="目录">
                <i className="iconfont icon-mulu1" />
              </Tooltip>
            )}
            <span className={styles['menu-label']}>{item.label}</span>
            {item.type === 'directory' && (
              <Tooltip title="目录操作">
                <button type="button" className={styles['ghost-action']} aria-label="目录操作">
                  <i className="iconfont icon-gengduo"></i>
                </button>
              </Tooltip>
            )}
          </div>
        ))}
      </nav>

      <section className={styles['repo-list-section']}>
        <div className={styles['repo-items']}>
          {repo_list.map((item, index) => (
            <div
              key={`${item.name}-${item.update_time}`}
              className={[styles['repo-item'], 'cursor-pointer'].join(' ')}
              onClick={() => handleToDetail(item.id)}
            >
              <span className={`${styles['repo-item-name']} ellipse-one-line`}>{item.name}</span>
              <Tooltip title="目录操作">
                <button type="button" className={styles['ghost-action']} aria-label="目录操作">
                  <i className="iconfont icon-gengduo"></i>
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
};

export default RepoSide;
