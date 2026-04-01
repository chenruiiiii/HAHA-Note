import logoImg from '@/assets/images/logo.png';
import styles from './style.module.scss';
import { RepoDetailType } from '../../types';

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
  const displayedRepoList = repo_list.slice(0, 8);
  const ownerAvatar = avatar[0];

  return (
    <aside className={styles['repo-aside']}>
      <div className={styles['repo-header']}>
        <div className={styles['repo-header-main']}>
          <img className={styles['repo-logo']} src={logoImg.src} alt="logo" />
          <div className={styles['repo-title-group']}>
            <div className={styles['repo-owner']}>个人知识库</div>
            <div className={styles['repo-title-row']}>
              <span className={styles['repo-title']}>{name}</span>
            </div>
          </div>
        </div>
        <button type="button" className={styles['ghost-action']} aria-label="更多操作">
          <i className="iconfont icon-gengduo"></i>
        </button>
      </div>

      <nav className={styles['menu-group']} aria-label="仓库导航">
        {mainMenuList.map((item) => (
          <div
            key={item.key}
            className={['cursor-pointer', styles['menu-item'], styles['menu-item-active']].join(
              ' '
            )}
          >
            {item.type === 'home' && <i className="iconfont icon-shouye" />}
            {item.type === 'directory' && <i className="iconfont icon-mulu1" />}
            <span className={styles['menu-label']}>{item.label}</span>
            {item.type === 'directory' && (
              <button type="button" className={styles['ghost-action']} aria-label="目录操作">
                <i className="iconfont icon-gengduo"></i>
              </button>
            )}
          </div>
        ))}
      </nav>

      <section className={styles['repo-list-section']}>
        <div className={styles['repo-items']}>
          {displayedRepoList.map((item, index) => (
            <div
              key={`${item.name}-${item.update_time}`}
              className={[styles['repo-item'], 'cursor-pointer'].join(' ')}
            >
              <span className={`${styles['repo-item-name']} ellipse-one-line`}>{item.name}</span>
              {index === 0 && (
                <button type="button" className={styles['repo-item-action']} aria-label="更多操作">
                  <i className="iconfont icon-gengduo"></i>
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
};

export default RepoSide;
