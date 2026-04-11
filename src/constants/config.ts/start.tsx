import { MenuProps } from 'antd';
// 首页开始新建选项数据配置
export const NEW_INFO = [
  {
    title: '新建文档',
    icon: 'icon-xinjianwendang',
    type: 'note',
    color: '#1681FF',
    description: '',
    drop: true,
  },
  {
    title: '新建知识库',
    icon: 'icon-xinjianzhishiku',
    type: 'repo',
    color: '#46C870',
    description: '使用知识库整理知识',
    drop: false,
  },
  // {
  //   title: '模板中心',
  //   icon: 'icon-mobanzhongxin',
  //   type: 'team',
  //   color: '#ED831A',
  //   description: '从模版中获取灵感',
  //   drop: false,
  // },
];

// 新建文档下拉框内容
export const NEW_DOCUMENT_OPTIONS: MenuProps['items'] = [
  {
    key: '1',
    label: '新建文档',
    icon: <i className="iconfont icon-xinjianwendang" style={{ color: '#1681FF' }}></i>,
  },
  {
    key: '2',
    label: '新建表格',
    icon: <i className="iconfont icon-xinjianbiaoge" style={{ color: '#46C870' }}></i>,
  },
  {
    key: '3',
    label: '新建画板',
    icon: <i className="iconfont icon-xinjianhuaban" style={{ color: '#ED831A' }}></i>,
  },
  {
    key: '4',
    label: '新建数据表',
    icon: <i className="iconfont icon-biaoge" style={{ color: '#1FC594' }}></i>,
  },
  {
    type: 'divider',
  },
  {
    key: '5',
    label: '导入...',
    icon: <i className="iconfont icon-daoru" style={{ color: '#aaa' }}></i>,
  },
];

// 类型信息
const TYPE_OPTIONS: MenuProps['items'] = [
  {
    key: '0',
    label: '全部',
  },
  {
    key: '1',
    label: '文档',
  },
  {
    key: '2',
    label: '表格',
  },
  {
    key: '3',
    label: '画板',
  },
  {
    key: '4',
    label: '数据表',
  },
];

// 归属信息
const OWNER_OPTIONS: MenuProps['items'] = [
  {
    key: '0',
    label: '全部',
  },
  {
    key: '1',
    label: '我创建的',
  },
  {
    key: '2',
    label: '我协作的',
  },
  {
    key: '3',
    label: '我收藏的',
  },
];

// 创建者信息
const CREATOR_OPTIONS: MenuProps['items'] = [
  {
    key: '0',
    label: '全部',
  },
  {
    key: '1',
    label: '我创建的',
  },
  {
    key: '2',
    label: '我协作的',
  },
];

// 首页筛选信息
export const FILTER_INFO = [
  {
    label: '类型',
    options: TYPE_OPTIONS,
  },
  {
    label: '归属',
    options: OWNER_OPTIONS,
  },
  {
    label: '创建者',
    options: CREATOR_OPTIONS,
  },
];
