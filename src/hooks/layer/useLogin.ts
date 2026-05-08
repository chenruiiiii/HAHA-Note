'use client';

import { postLogin } from '@/services/login';
import { AxiosError } from 'axios';
import { message } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface LoginFormValues {
  username: string;
  password: string;
}

function getSafeRedirectPath(redirectPath: string | null) {
  if (!redirectPath || !redirectPath.startsWith('/') || redirectPath.startsWith('/login')) {
    return '/';
  }

  return redirectPath;
}

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      const response = await postLogin(values);
      message.success(response.message || '登录成功');

      const redirectPath = getSafeRedirectPath(searchParams.get('redirect'));
      router.replace(redirectPath);
      router.refresh();
    } catch (error) {
      console.error('login failed', error);
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message || error.message
          : '登录失败，请检查账号或密码';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleLogin,
  };
}
