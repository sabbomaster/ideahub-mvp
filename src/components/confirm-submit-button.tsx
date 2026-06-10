"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmSubmitButtonProps = {
  message: string;
};

export function ConfirmSubmitButton({ message }: ConfirmSubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant="destructive"
      size="sm"
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
