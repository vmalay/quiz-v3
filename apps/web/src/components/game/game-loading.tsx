'use client';

interface GameLoadingProps {
  message?: string;
}

export function GameLoading({ message = "Loading game..." }: GameLoadingProps) {
  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">{message}</span>
      </div>
    </div>
  );
}