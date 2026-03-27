import { message } from 'antd';

export const successMessage = (content: string) => {
  message.destroy();
  message.success(content);
};
export const errorMessage = (content: string) => {
  message.destroy();
  message.error(content);
};
export const infoMessage = (content: string) => {
  message.destroy();
  message.info(content);
};
export const warningMessage = (content: string) => {
  message.destroy();
  message.warning(content);
};
