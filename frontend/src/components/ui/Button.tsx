import Link from "next/link";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import { ArrowUpRight } from "lucide-react";

type Variant = "primary" | "accent" | "ghost" | "outline";
type Size = "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 shadow-[0_8px_30px_-8px_rgba(10,77,166,0.6)]",
  accent:
    "bg-accent-500 text-white hover:bg-accent-600 shadow-[0_8px_30px_-8px_rgba(217,42,52,0.65)]",
  ghost: "bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 border border-white/20",
  outline: "border border-primary-600/30 text-primary-700 hover:bg-primary-600/5",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-4 text-base",
};

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  withArrow?: boolean;
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  withArrow = false,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
      {withArrow && (
        <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      )}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
  withArrow = true,
  target,
}: CommonProps & { href: string; target?: string }) {
  return (
    <Link
      href={href}
      target={target}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
      {withArrow && (
        <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      )}
    </Link>
  );
}
