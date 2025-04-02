import { Button } from "./button";
import { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface LineButtonProps {
  variant?: "primary" | "secondary" | "outline";
  fullWidth?: boolean;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function LineButton({
  className,
  variant = "primary",
  fullWidth = false,
  children,
  onClick,
  disabled,
  type = "button"
}: LineButtonProps) {
  // Map our custom variants to Button variants
  let buttonVariant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" = "default";
  if (variant === "outline") buttonVariant = "outline";
  else if (variant === "secondary") buttonVariant = "secondary";
  
  return (
    <Button
      variant={buttonVariant}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "font-medium rounded-lg transition-colors",
        variant === "primary" && "bg-[#06C755] hover:bg-[#05a649] text-white",
        variant === "secondary" && "bg-[#F8F9FA] hover:bg-[#E9ECEF] text-[#495057]",
        variant === "outline" && "bg-transparent border border-[#06C755] text-[#06C755] hover:bg-[#06C755]/10",
        fullWidth && "w-full",
        className
      )}
    >
      {children}
    </Button>
  );
}
