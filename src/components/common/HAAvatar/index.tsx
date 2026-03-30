import { Avatar } from 'antd';
import './style.scss';

type size = 'small' | 'middle' | 'large';
interface HAAvatarProps {
  size?: size;
  url?: string;
}

function HAAvatar({ size = 'small', url }: HAAvatarProps) {
  return <div>{url ? <Avatar size={size} src={url} /> : <Avatar size={size} />}</div>;
}

export default HAAvatar;
