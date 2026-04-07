import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';

export const useRouterParams = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathName = usePathname();
};
