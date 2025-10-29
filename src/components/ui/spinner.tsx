import * as React from "react"
import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8"
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export { Spinner }