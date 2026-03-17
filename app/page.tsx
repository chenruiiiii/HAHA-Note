import '@/assets/styles/index.scss';
import App from '../src/views/index';
// Ant Design 如果需要
import 'antd/dist/reset.css';
// 更改ant-design 主题'
import theme_config from '@/assets/styles/theme/theme_config';
import '@/assets/styles/var.scss';
import { ConfigProvider } from 'antd';
export default function Home() {
  return (
    <ConfigProvider theme={theme_config}>
      <App />
    </ConfigProvider>
  );
}
