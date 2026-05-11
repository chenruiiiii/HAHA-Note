'use client';

import { postLogin } from '@/services/login';
import { AxiosError } from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { errorMessage, successMessage } from '@/utils/message_reminder';

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
      successMessage(response.message || '登录成功');

      const redirectPath = getSafeRedirectPath(searchParams.get('redirect'));
      router.replace(redirectPath);
      router.refresh();
    } catch (error) {
      console.error('login failed', error);
      const loginErrorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message || error.message
          : '登录失败，请检查账号或密码';
      errorMessage(loginErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleLogin,
  };
}
