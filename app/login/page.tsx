'use client';

import { WEBSITE_INFO } from '@/constants/config.ts';
import { PROTOCOL_INFO } from '@/constants/config.ts/login';
import { useLogin } from '@/hooks/layer/useLogin';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input } from 'antd';
import Image from 'next/image';
import OtherLogin from './components/other_login';
import { form_rules } from './config/rules';
import './style.scss';

export default function LoginPage() {
  const [form] = Form.useForm();
  const { loading, handleLogin } = useLogin();
  const { name, title } = WEBSITE_INFO;
  const { username, password } = form_rules;
  const { warning, user, company } = PROTOCOL_INFO;

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo 区域 */}
        <div className="logo-section">
          <div className="logo">
            <div className="icon">
              <Image src="/logo.ico" alt="logo" width={48} height={48} className="logo-img" />
            </div>
            <div className="title">{name}</div>
          </div>
          <p className="description">{title}</p>
        </div>

        {/* 表单区域 */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          initialValues={{ remember: true }}
        >
          <div className="form-section">
            <Form.Item name="username" rules={username.rules}>
              <Input
                size="large"
                prefix={<UserOutlined />}
                placeholder={username.defaultValue}
                maxLength={20}
              />
            </Form.Item>

            <Form.Item name="password" rules={password.rules}>
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder={password.defaultValue}
                maxLength={20}
              />
            </Form.Item>

            <Form.Item>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住登录状态</Checkbox>
              </Form.Item>
              <a href="#" style={{ float: 'right' }}>
                忘记密码？
              </a>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                className="login-btn"
              >
                登录
              </Button>
            </Form.Item>
          </div>
        </Form>

        {/* 协议 */}
        <div className="agreement">
          {warning}
          <a href={user.link}> {user.text}</a> 和<a href={company.link}> {company.text}</a>
        </div>

        {/* 其他登录方式 */}
        <OtherLogin></OtherLogin>
      </div>
    </div>
  );
}
