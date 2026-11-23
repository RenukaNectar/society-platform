// Spinner.tsx
import React from "react";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
}

export default function Spinner({ size = "md" }: SpinnerProps) {
  const sizes: Record<SpinnerSize, string> = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-4",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`
          ${sizes[size]}
          animate-spin
          rounded-full
          border-gray-300
          border-t-blue-500
        `}
      />
    </div>
  );
}