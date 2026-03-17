// theme/themeConfig.ts
import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

const theme_config: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#ff5500',
    colorInfo: '#ff5500',
    colorBgBase: '#ffffff', // 明确指定背景色为白色
    colorTextBase: '#000000', // 明确指定文字色为黑色
  },
  components: {
    Menu: {
      algorithm: true,
    },
  },
};

export default theme_config;
