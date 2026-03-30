import HAEmpty from "@/components/common/HAEmpty";
import { ReactNode } from "react";

export const handleEmpty = (data: Array<any>, node: ReactNode) => {
  if (data.length === 0 || !data) return <HAEmpty />;
  return node;
};
