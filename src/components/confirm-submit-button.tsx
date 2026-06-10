"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmSubmitButtonProps = {
  className?: string;
  message: string;
};

export function ConfirmSubmitButton({ className, message }: ConfirmSubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant="destructive"
      size="sm"
      className={cn("w-full sm:w-auto", className)}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      削除
    </Button>
  );
}
