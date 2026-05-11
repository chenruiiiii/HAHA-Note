import { message } from 'antd';

type MessageApi = ReturnType<typeof message.useMessage>[0];

let scopedMessageApi: MessageApi | null = null;

export const setMessageApi = (api: MessageApi | null) => {
  scopedMessageApi = api;
};

const getMessageApi = () => scopedMessageApi ?? message;

export const successMessage = (content: string) => {
  const messageApi = getMessageApi();
  messageApi.destroy();
  messageApi.success(content);
};
export const errorMessage = (content: string) => {
  const messageApi = getMessageApi();
  messageApi.destroy();
  messageApi.error(content);
};
export const infoMessage = (content: string) => {
  const messageApi = getMessageApi();
  messageApi.destroy();
  messageApi.info(content);
};
export const warningMessage = (content: string) => {
  const messageApi = getMessageApi();
  messageApi.destroy();
  messageApi.warning(content);
};
