import * as React from "react";
import { cn } from "./utils";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref){
  return <input ref={ref} className={cn("h-9 w-full rounded-2xl border px-3 text-sm outline-none", className)} {...props}/>;
});