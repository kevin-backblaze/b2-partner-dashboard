import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "./utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger(
  { className, children, ...props }:
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "inline-flex h-9 w-full items-center justify-between rounded-2xl border bg-white px-3 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-slate-300",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="ml-2 opacity-60">▾</SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent(
  { className, children, position = "popper", ...props }:
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & { position?: "item-aligned" | "popper" }
) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        sideOffset={6}
        className={cn(
          "z-[9999] min-w-[10rem] overflow-hidden rounded-2xl border bg-white shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="px-3 py-1 text-xs opacity-70">▲</SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className={cn(position === "popper" && "p-1")}>
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="px-3 py-1 text-xs opacity-70">▼</SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm outline-none",
      "data-[highlighted]:bg-slate-100 data-[state=checked]:bg-slate-100",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="ml-auto">✓</SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

export const SelectGroup = SelectPrimitive.Group;
export const SelectLabel = (props: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>) =>
  <SelectPrimitive.Label className={cn("px-3 py-2 text-xs text-slate-500", (props as any).className)} {...props} />;
export const SelectSeparator = (props: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>) =>
  <SelectPrimitive.Separator className={cn("my-1 h-px bg-slate-200", (props as any).className)} {...props} />;
