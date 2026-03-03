import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Menu, type MenuProps } from 'antd';

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem('添加', '1', <PieChartOutlined />),
  getItem('搜索', '2', <DesktopOutlined />),
  getItem('最近打开', 'sub1', <UserOutlined />),
  getItem('AI助手', 'sub2', <TeamOutlined />),
  getItem('收藏', '9', <FileOutlined />),
];

export default function SideBar() {
  
  return (
    <>
    <div className="demo-logo-vertical" />
      <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={items} />
    </>
  )
}