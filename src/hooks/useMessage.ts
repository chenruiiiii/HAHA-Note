import { message } from 'antd';

export default function useMessage() {
  const [messageApi, contextHolder] = message.useMessage();
  const successMessage = (content: string) => {
    messageApi.open({
      type: 'success',
      content,
    });
  };
  const errorMessage = (content: string) => {
    messageApi.open({
      type: 'error',
      content,
    });
  };
  const infoMessage = (content: string) => {
    messageApi.open({
      type: 'info',
      content,
    });
  };
  const warningMessage = (content: string) => {
    messageApi.open({
      type: 'warning',
      content,
    });
  };
  return {
    successMessage,
    errorMessage,
    infoMessage,
    warningMessage,
    contextHolder,
  };
}
