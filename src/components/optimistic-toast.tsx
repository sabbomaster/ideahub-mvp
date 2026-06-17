"use client";

type OptimisticToastProps = {
  message: string | null;
  variant?: "error" | "success";
};

export function OptimisticToast({ message, variant = "error" }: OptimisticToastProps) {
  if (!message) return null;

  const styles =
    variant === "success"
      ? "border-green-600/30 bg-green-50 text-green-800"
      : "border-destructive/30 bg-background text-destructive";

  return (
    <div className={`pointer-events-none fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-md border px-4 py-3 text-sm font-medium shadow-lg ${styles}`}>
      {message}
    </div>
  );
}
