// theme/themeConfig.ts
import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

const theme_config: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#ff5500',
    colorInfo: '#ff5500',
    colorBgBase: '#fafafa', // 明确指定背景色为白色
    colorTextBase: '#0D0D0D', // 明确指定文字色为黑色
  },
  components: {
    Layout: {
      headerBg: '#fafafa',
      siderBg: '#fafafa',
      triggerBg: '#fafafa',
    },

    Menu: {
      itemSelectedColor: '#ff5500',
      itemSelectedBg: '#fff2e8',
    },
  },
};

export default theme_config;
