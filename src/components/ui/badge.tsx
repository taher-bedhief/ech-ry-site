import * as React from "react";
import { cn } from "@/lib/utils"; // utilitaire pour concaténer les classes Tailwind

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "outline"
    | "secondary";
  size?: "sm" | "md" | "lg";
  rounded?: "sm" | "md" | "lg" | "full";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  rounded = "md",
  ...props
}: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-gray-200 text-gray-800",
    success: "bg-green-200 text-green-800",
    warning: "bg-yellow-200 text-yellow-800",
    error: "bg-red-200 text-red-800",
    info: "bg-blue-200 text-blue-800",
    outline: "border border-gray-400 text-gray-700",
    secondary: "bg-purple-200 text-purple-800",
  };

  const sizes: Record<string, string> = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const roundings: Record<string, string> = {
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium",
        variants[variant],
        sizes[size],
        roundings[rounded],
        className
      )}
      {...props}
    />
  );
}

export default Badge;
