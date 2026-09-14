import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-surface rounded-card shadow-card transition-[box-shadow,transform] hover:shadow-card-hover hover:-translate-y-[3px] ${className}`}
      {...props}
    />
  );
}

export function Panel({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-surface rounded-panel ${className}`} {...props} />;
}
