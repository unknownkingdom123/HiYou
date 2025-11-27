import { Bot } from "lucide-react";
import { Link } from "wouter";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showLink?: boolean;
}

export function Logo({ size = "md", showLink = true }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-9 w-9",
  };

  const content = (
    <div className="flex items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
        <Bot className={`${iconSizes[size]} text-primary-foreground`} />
      </div>
      <span className={`font-bold ${sizeClasses[size]}`}>
        ClgBooksAI <span className="text-primary">Bot</span>
      </span>
    </div>
  );

  if (showLink) {
    return (
      <Link href="/" className="inline-flex" data-testid="link-home-logo">
        {content}
      </Link>
    );
  }

  return content;
}
