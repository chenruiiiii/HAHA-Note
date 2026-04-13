'use client';
import { FieldNamesType } from 'antd/es/cascader';
import styles from './style.module.scss';
import { Button, Form, FormProps, Input } from 'antd';

type FieldType = {
  repoName?: string;
  description?: string;
};

const NewRepoModal = () => {
  const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
    console.log('Success:', values);
  };

  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };
  return (
    <div className={styles['new-repo-modal']}>
      <Form name="basic" onFinish={onFinish} onFinishFailed={onFinishFailed} autoComplete="off">
        <Form.Item<FieldType>
          name="repoName"
          label={'🧀库名称'}
          rules={[{ required: true, message: 'Please input your repoName!' }]}
        >
          <Input placeholder="知识库名称" />
        </Form.Item>
        <Form.Item<FieldType> name="description">
          <Input.TextArea placeholder="知识库简介（选填）" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%', padding: '3px 0' }}>
            新建
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default NewRepoModal;
