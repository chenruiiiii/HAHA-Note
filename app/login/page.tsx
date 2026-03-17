'use client';

import { WEBSITE_INFO } from '@/constants/config.ts';
import { AREA_CODES, PROTOCOL_INFO } from '@/constants/config.ts/login';
import { LockOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, message, Select, Space } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import OtherLogin from './components/other_login';
import { form_rules } from './config/rules';
import './style.scss';

export default function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [getCodeLoading, setGetCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const { name, title } = WEBSITE_INFO;
  const { phone, code } = form_rules;
  const { warning, user, company } = PROTOCOL_INFO;

  // 获取验证码
  const handleGetCode = async () => {
    const phone = form.getFieldValue('phone');
    if (!phone || phone.length !== 11) {
      message.error('请输入正确的手机号');
      return;
    }

    setGetCodeLoading(true);
    try {
      // 这里调用获取验证码的API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success('验证码已发送');

      // 开始倒计时
      let count = 60;
      setCountdown(count);
      const timer = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count === 0) {
          clearInterval(timer);
        }
      }, 1000);
    } catch (error) {
      message.error('发送失败，请重试');
    } finally {
      setGetCodeLoading(false);
    }
  };

  // 登录
  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      // 这里调用登录API
      await new Promise((resolve) => setTimeout(resolve, 1500));
      message.success('登录成功');

      // 跳转到首页
      router.push('/');
    } catch (error) {
      message.error('登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo 区域 */}
        <div className="logo-section">
          <div className="logo">
            <div className="icon">
              <img src="../../public/logo.ico" alt="logo" className="logo-img" />
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
          initialValues={{ areaCode: '+86', remember: true }}
        >
          <div className="form-section">
            <Form.Item name="phone" rules={phone.rules}>
              <div className="phone">
                <Space.Compact>
                  <Select defaultValue="+86" options={AREA_CODES} className="countrySelect" />
                  <Input size="large" defaultValue={phone.defaultValue} />
                </Space.Compact>
              </div>
            </Form.Item>

            <Form.Item name="code" rules={code.rules}>
              <div className="verification-code">
                <Input
                  size="large"
                  prefix={<LockOutlined />}
                  placeholder={code.defaultValue}
                  maxLength={6}
                />
                <Button
                  className="code-btn"
                  size="large"
                  onClick={handleGetCode}
                  loading={getCodeLoading}
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                </Button>
              </div>
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
