import { Menu, type MenuProps } from 'antd';
import './style.scss';
import Link from 'next/link';

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
  getItem(
    <Link href="/">开始</Link>,
    '1',
    <i className="iconfont icon-zhukongtai" style={{ color: '#FBC91A' }}></i>
  ),
  getItem(
    <Link href="/ai-chat-home">AI写作</Link>,
    '2',
    <i className="iconfont icon-aixiezuo" style={{ color: '#49CA72' }}></i>
  ),
  getItem(
    <Link href="/subtotal">小记</Link>,
    '3',
    <i className="iconfont icon-xiaoji" style={{ color: '#36AFA2' }}></i>
  ),
  getItem(
    <Link href="/collect">收藏</Link>,
    '4',
    <i className="iconfont icon-shoucang1" style={{ color: '#4E30DC' }}></i>
  ),
  getItem(
    <Link href="/stroll">逛逛</Link>,
    '5',
    <i className="iconfont icon-guangguang1" style={{ color: '#FF3A0C' }}></i>
  ),
];
const ITEMS_DOWN: MenuItem[] = [
  getItem('知识库', 'sub1', <i className="iconfont icon-zhishiku" style={{ color: '#0062FF' }} />, [
    getItem('web前端', '6'),
  ]),
];
const LOGO: MenuItem[] = [
  getItem(
    'HAHA-Note',
    'logo',
    <img
      src="../../../../assets/images/logo.png
    "
      alt=""
    />
  ),
];

export default function SideBar() {
  return (
    <>
      <div className="menu-content">
        <Menu items={LOGO} />
        <Menu defaultSelectedKeys={['1']} mode="inline" items={ITEMS_UP} />
        <div className="space"></div>
        <Menu
          defaultSelectedKeys={['1']}
          defaultOpenKeys={['sub1']}
          mode="inline"
          items={ITEMS_DOWN}
        />
      </div>
    </>
  );
}
