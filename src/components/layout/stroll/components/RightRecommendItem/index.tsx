'use client';
import styles from './style.module.scss';
import HAAvatar from '@/components/common/HAAvatar';
import { RightRecommendItemType } from '../../types/recommend';
import { useRouter } from 'next/navigation';

const RightRecommendItem = ({
  id,
  user: { avatar, username },
  recommend_title,
}: RightRecommendItemType) => {
  const router = useRouter();
  const handleToDetail = () => {
    window.open(`${process.env.NEXT_PUBLIC_BASE_URL}/public-note/${id}`, '_blank');
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
            {username}
          </div>
          <div
            className={[styles['signature'], 'ellipse-one-line', 'cursor-pointer-hover'].join(' ')}
            onClick={handleToDetail}
          >
            {recommend_title}
            {recommend_title}
          </div>
        </div>
      </div>
      <div
        className={[styles['recommend-title'], 'ellipse-one-line', 'cursor-pointer-hover'].join(
          ' '
        )}
        onClick={handleToDetail}
      >
        {recommend_title}
      </div>
    </div>
  );
};

export default RightRecommendItem;
