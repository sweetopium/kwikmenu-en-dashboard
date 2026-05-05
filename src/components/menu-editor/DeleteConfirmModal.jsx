import { Trash2 } from 'lucide-react';
import { Button } from "../ui/button";

const DeleteConfirmModal = ({ deleteConfirm, onCancel, onConfirm }) => {
  if (!deleteConfirm) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-card w-full max-w-sm rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6 text-center space-y-4 pt-8">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-2">
            <Trash2 size={28} />
          </div>

          <h2 className="text-xl font-bold text-foreground">
            {deleteConfirm.type === 'category' ? 'Удалить категорию?' : 'Удалить блюдо?'}
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed px-2">
            Вы уверены, что хотите удалить{' '}
            <span className="font-bold text-foreground">«{deleteConfirm.name}»</span>?
            {deleteConfirm.type === 'category' && ' Все блюда внутри этой категории также будут навсегда удалены.'}{' '}
            Это действие нельзя отменить.
          </p>
        </div>

        <div className="p-4 sm:p-6 border-t border-border/60 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-secondary/10">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto rounded-xl border-border/60 hover:bg-secondary font-semibold"
          >
            Отмена
          </Button>

          <Button
            onClick={onConfirm}
            className="w-full sm:w-auto rounded-xl bg-destructive hover:bg-destructive/90 text-white font-semibold shadow-md px-6"
          >
            Удалить
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
