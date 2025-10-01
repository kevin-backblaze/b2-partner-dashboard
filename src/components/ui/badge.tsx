import * as React from "react";
import { cn } from "./utils";
type Props = React.HTMLAttributes<HTMLSpanElement> & { variant?: "default"|"secondary"|"outline" };
export function Badge({ className, variant="default", ...props }: Props){
  const variants = {
    default: "bg-slate-900 text-white",
    secondary: "bg-slate-100 text-slate-900",
    outline: "border border-slate-200 text-slate-700"
  } as const;
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs", variants[variant], className)} {...props}/>;
}