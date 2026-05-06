import HALoading from '@/components/common/HALoading';
import { Suspense } from 'react';
import LoginPage from './page';

export default function LoginLayout() {
  return (
    <Suspense fallback={<HALoading type="simple" />}>
      <LoginPage />
    </Suspense>
  );
}
