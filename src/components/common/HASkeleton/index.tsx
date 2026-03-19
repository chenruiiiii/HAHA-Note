import { Skeleton } from 'antd';

interface SkeletonProps {
  num: number;
}

function HASkeleton({ num }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: num }).map((_, index) => (
        <Skeleton />
      ))}
    </>
  );
}

export default HASkeleton;
