import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Menu, type MenuProps } from 'antd';
import Avatar from 'antd/es/avatar/Avatar';
import './index.scss';

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const ITEMS_UP: MenuItem[] = [
  getItem('开始', '1', <PieChartOutlined />),
  getItem('AI写作', '2', <DesktopOutlined />),
  getItem('小记', '3', <UserOutlined />),
  getItem('收藏', '4', <TeamOutlined />),
  getItem('逛逛', '5', <FileOutlined />),
];
const ITEMS_DOWN: MenuItem[] = [
  getItem('知识库', 'sub1', <i className="iconfont icon-icon-yichang" />, [
    getItem('web前端', '6'),
  ]),
];
const LOGO = {
  key: 'logo',
  icon: "../../../../assets/images/logo.ico",
  title: 'haha',
}

export default function SideBar() {
  return (
    <>
      <div className="f-sb font-color-white sidebar">
        <div className="f-left">
          <img src={ LOGO.icon } alt={ LOGO.key } />
          <div className="logo-title">{ LOGO.title }</div>
        </div>
        <div className="f-right">
          <i className="iconfont icon-icon-yichang"></i>
          <Avatar size={32} src="../../../../assets/images/avatar.png" />
        </div>
      </div>
      <div className="menu-content">
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={ITEMS_UP} />
      <div className="space"></div>
      <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={ITEMS_DOWN} />
      </div>
    </>
  );
}
