'use client';
import { Menu, Tooltip, type MenuProps } from 'antd';
import './style.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import logo from '@/assets/images/logo.png';

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
    '/',
    <i className="iconfont icon-zhukongtai" style={{ color: '#FBC91A' }}></i>
  ),
  getItem(
    <Link href="/ai-chat-home">AI写作</Link>,
    '/ai-chat-home"',
    <i className="iconfont icon-aixiezuo" style={{ color: '#49CA72' }}></i>
  ),
  // getItem(
  //   <Link href="/subtotal">小记</Link>,
  //   '/subtotal',
  //   <i className="iconfont icon-xiaoji" style={{ color: '#36AFA2' }}></i>
  // ),
  getItem(
    <Link href="/collect">收藏</Link>,
    '/collect',
    <i className="iconfont icon-shoucang1" style={{ color: '#4E30DC' }}></i>
  ),
  getItem(
    <Link href="/stroll">逛逛</Link>,
    '/stroll',
    <i className="iconfont icon-guangguang1" style={{ color: '#FF3A0C' }}></i>
  ),
];

const ITEMS_DOWN: MenuItem[] = [
  getItem(
    <Link href="/repository">知识库</Link>,
    'sub1',
    <i className="iconfont icon-zhishiku" style={{ color: '#0062FF' }} />,
    [getItem(<Link href={`/repo-detail/99999/home`}>Web前端</Link>, '6')]
  ),
];

export default function SideBar() {
  const pathName = usePathname();
  // 计算当前选中的 key
  const getSelectedKey = () => {
    // 处理根路径
    if (pathName === '/') return '/';

    // 处理知识库子路由
    if (pathName.startsWith('/knowledge/')) {
      return pathName; // 返回完整路径作为 key
    }

    // 返回当前路径（与 ITEMS_UP 中的 key 匹配）
    return pathName;
  };
  return (
    <>
      <div className="menu-content">
        <div className="space-logo">
          <Tooltip title="HAHA-Note">
            <img
              src={logo.src} // 直接使用导入的图片
              alt="HAHA-Note"
              width={35} // 必须指定宽度
              height={35} // 必须指定高度
              style={{ borderRadius: '50%' }}
              className="shadow"
            />
          </Tooltip>
        </div>
        <Menu defaultSelectedKeys={[getSelectedKey() || '/']} mode="inline" items={ITEMS_UP} />
        <div className="space"></div>
        <Menu
          defaultSelectedKeys={['1']}
          defaultOpenKeys={[getSelectedKey() || '/']}
          mode="inline"
          items={ITEMS_DOWN}
        />
      </div>
    </>
  );
}
