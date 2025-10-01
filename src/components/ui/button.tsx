import * as React from "react";
import { cn } from "./utils";
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default"|"secondary"|"ghost", size?: "default"|"icon" };
export const Button = React.forwardRef<HTMLButtonElement, Props>(function Btn({ className, variant="default", size="default", ...props }, ref){
  const base = "inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-medium shadow-sm transition";
  const variants = {
    default: "bg-slate-900 text-white hover:opacity-90",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    ghost: "bg-transparent hover:bg-slate-100"
  } as const;
  const sizes = { default: "h-9", icon: "h-9 w-9 p-0" } as const;
  return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}/>;
});