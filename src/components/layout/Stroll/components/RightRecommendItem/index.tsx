'use client';
import styles from './style.module.scss';
import HAAvatar from '@/components/common/HAAvatar';
import { RecommendDetailType } from '../../types/recommend';

const RightRecommendItem = ({ _id, author: { avatar, name }, title_html }: RecommendDetailType) => {
  const handleToDetail = () => {
    window.open(`${process.env.NEXT_PUBLIC_BASE_URL}/public-note/${_id}`, '_blank');
  };
  return (
    <div className={[styles['recommend-item']].join(' ')}>
      <div className={styles['info']}>
        <HAAvatar size="middle" url={avatar} />
        <div className={styles['right']}>
          <div
            className={[styles['username'], 'ellipse-one-line', 'cursor-pointer'].join(' ')}
            onClick={handleToDetail}
          >
            {name}
          </div>
          <div
            className={[styles['signature'], 'ellipse-one-line', 'cursor-pointer-hover'].join(' ')}
            onClick={handleToDetail}
          >
            {title_html}
            {title_html}
          </div>
        </div>
      </div>
      <div
        className={[styles['recommend-title'], 'ellipse-one-line', 'cursor-pointer-hover'].join(
          ' '
        )}
        onClick={handleToDetail}
      >
        {title_html}
      </div>
    </div>
  );
};

export default RightRecommendItem;
