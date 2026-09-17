import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-teal-600 aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-[#164739] text-white hover:bg-[#205e4c] shadow-xs",
        destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-xs",
        outline: "border border-[#cfe0d3] bg-white hover:bg-[#f2f7f3] text-[#173d31]",
        secondary: "bg-[#e5f3e8] text-[#19513e] hover:bg-[#d6ebd9]",
        ghost: "hover:bg-[#eaf3ec] text-[#173d31]",
        link: "text-[#1f8758] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2.5 rounded-xl text-sm font-semibold",
        sm: "h-10 rounded-xl px-4 text-xs font-semibold",
        lg: "h-13 rounded-xl px-8 text-base font-bold",
        xl: "h-14 rounded-xl px-9 text-base font-bold",
        xxl: "h-16 rounded-xl px-10 text-lg font-bold",
        icon: "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
