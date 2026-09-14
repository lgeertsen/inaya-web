import { HTMLAttributes } from "react";

export function Container({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mx-auto w-full max-w-(--container-content) px-6 ${className}`}
      {...props}
    />
  );
}
