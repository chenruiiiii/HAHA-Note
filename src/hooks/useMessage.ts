import { message } from 'antd';

export default function useMessage() {
  const [contextHolder] = message.useMessage();
  const successMessage = (content: string) => {
    message.destroy();
    message.success(content);
  };
  const errorMessage = (content: string) => {
    message.destroy();
    message.error(content);
  };
  const infoMessage = (content: string) => {
    message.destroy();
    message.info(content);
  };
  const warningMessage = (content: string) => {
    message.destroy();
    message.warning(content);
  };
  return {
    successMessage,
    errorMessage,
    infoMessage,
    warningMessage,
  };
}
