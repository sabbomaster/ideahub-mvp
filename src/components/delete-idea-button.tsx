import { deleteArchivedIdea } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

type DeleteIdeaButtonProps = {
  ideaId: string;
};

export function DeleteIdeaButton({ ideaId }: DeleteIdeaButtonProps) {
  return (
    <form action={deleteArchivedIdea.bind(null, ideaId)} className="w-full sm:w-auto">
      <ConfirmSubmitButton message="このアイデアを完全に削除します。よろしいですか？" />
    </form>
  );
}
