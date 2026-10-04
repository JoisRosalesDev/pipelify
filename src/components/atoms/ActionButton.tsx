"use client";

import React, {
  ButtonHTMLAttributes,
  AnchorHTMLAttributes,
  forwardRef,
} from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "destructive"
  | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface BaseActionButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

export type ActionButtonProps = BaseActionButtonProps &
  (
    | ({
        href: string;
        disabled?: boolean;
      } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">)
    | ({
        href?: undefined;
      } & ButtonHTMLAttributes<HTMLButtonElement>)
  );

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 border-transparent shadow-sm",
  secondary:
    "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700",
  outline:
    "bg-transparent text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800",
  destructive:
    "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600 border-transparent shadow-sm",
  ghost:
    "bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-[44px] min-w-[44px] px-3.5 py-2 text-xs rounded-md gap-1.5",
  md: "min-h-[44px] min-w-[44px] px-4 py-2.5 text-sm rounded-lg gap-2",
  lg: "min-h-[48px] min-w-[48px] px-5 py-3 text-base rounded-lg gap-2.5",
};

export const ActionButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ActionButtonProps
>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      icon,
      iconPosition = "left",
      fullWidth = false,
      disabled,
      className,
      children,
      href,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const content = (
      <>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            {loadingText ? <span>{loadingText}</span> : children}
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="shrink-0">{icon}</span>
            )}
            {children && <span>{children}</span>}
            {icon && iconPosition === "right" && (
              <span className="shrink-0">{icon}</span>
            )}
          </>
        )}
      </>
    );

    const classes = twMerge(
      clsx(
        "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] touch-manipulation select-none",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )
    );

    if (href) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          aria-busy={isLoading ? "true" : undefined}
          aria-disabled={isDisabled ? "true" : undefined}
          tabIndex={isDisabled ? -1 : undefined}
          {...(rest as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={isDisabled}
        className={classes}
        aria-busy={isLoading ? "true" : undefined}
        {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  }
);

ActionButton.displayName = "ActionButton";
