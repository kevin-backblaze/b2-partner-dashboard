import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "./utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ className, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>){
  return <SelectPrimitive.Trigger className={cn("inline-flex h-9 w-full items-center justify-between rounded-2xl border bg-white px-3 text-sm", className)} {...props} />;
}

export function SelectContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>){
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content className={cn("z-50 overflow-hidden rounded-2xl border bg-white shadow-md", className)} {...props}>
        <SelectPrimitive.Viewport className="p-1" />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export const SelectItem = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(
  ({ className, ...props }, ref) => (
    <SelectPrimitive.Item ref={ref} className={cn("relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm outline-none data-[highlighted]:bg-slate-100", className)} {...props} />
  )
);
SelectItem.displayName = "SelectItem";