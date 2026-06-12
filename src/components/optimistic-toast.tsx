"use client";

type OptimisticToastProps = {
  message: string | null;
};

export function OptimisticToast({ message }: OptimisticToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-md border border-destructive/30 bg-background px-4 py-3 text-sm text-destructive shadow-lg">
      {message}
    </div>
  );
}
