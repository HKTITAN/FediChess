import * as React from "react";

const buttonVariants = {
  variant: {
    default:
      "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-muted text-foreground hover:bg-muted/80",
    outline: "border border-border bg-transparent hover:bg-muted",
    ghost: "hover:bg-muted",
  },
  size: {
    sm: "h-9 px-3 text-sm",
    default: "h-10 px-4",
    lg: "h-11 px-8 text-lg",
  },
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
  asChild?: boolean;
}

const buttonClass = (variant: keyof typeof buttonVariants.variant, size: keyof typeof buttonVariants.size, className: string) =>
  `inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 ${buttonVariants.variant[variant]} ${buttonVariants.size[size]} ${className}`;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", asChild, children, ...props }, ref) => {
    const cn = buttonClass(variant, size, className);
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: `${cn} ${(children.props as { className?: string }).className ?? ""}`.trim(),
      });
    }
    return (
      <button ref={ref} className={cn} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
