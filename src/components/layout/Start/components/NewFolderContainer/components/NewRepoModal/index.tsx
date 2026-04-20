'use client';
import styles from './style.module.scss';
import { Button, Form, FormProps, Input, message } from 'antd';
import { useCreateRepositoryMutation } from '@/store/modules/repository';
import { useRouter } from 'next/navigation';

type FieldType = {
  repoName?: string;
  description?: string;
};

const NewRepoModal = () => {
  const router = useRouter();
  const [form] = Form.useForm<FieldType>();
  const [messageApi, contextHolder] = message.useMessage();
  const [createRepository, { isLoading }] = useCreateRepositoryMutation();

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    try {
      const result = await createRepository({
        title: values.repoName?.trim() || '',
        description: values.description?.trim(),
      }).unwrap();
      messageApi.success('知识库创建成功');
      form.resetFields();
      router.push(`/repo-detail/${result.data._id}/home`);
    } catch {
      messageApi.error('知识库创建失败，请稍后重试');
    }
  };

  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };
  return (
    <div className={styles['new-repo-modal']}>
      {contextHolder}
      <Form
        form={form}
        name="basic"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item<FieldType>
          name="repoName"
          label={'🧀库名称'}
          rules={[{ required: true, message: '请输入知识库名称~' }]}
        >
          <Input placeholder="知识库名称" />
        </Form.Item>
        <Form.Item<FieldType> name="description">
          <Input.TextArea placeholder="知识库简介（选填）" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            style={{ width: '100%', padding: '3px 0' }}
          >
            新建
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default NewRepoModal;
