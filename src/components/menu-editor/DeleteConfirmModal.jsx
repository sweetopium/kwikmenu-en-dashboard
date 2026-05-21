import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { Button } from "../ui/button";
import { secondaryActionButtonClasses } from "../../lib/uiStyles";

const DeleteConfirmModal = ({ deleteConfirm, onCancel, onConfirm }) => {
  const { t } = useTranslation();
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
            {deleteConfirm.type === 'category' ? t('menuEditor.delete.titleCategory') : t('menuEditor.delete.titleItem')}
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed px-2">
            {t('menuEditor.delete.confirmText', { name: deleteConfirm.name })}{' '}
            {deleteConfirm.type === 'category' && t('menuEditor.delete.categoryWarning')}{' '}
            {t('menuEditor.delete.irreversibleNote')}
          </p>
        </div>

        <div className="p-4 sm:p-6 border-t border-border/60 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-secondary/10">
          <Button
            variant="outline"
            onClick={onCancel}
            className={`w-full sm:w-auto ${secondaryActionButtonClasses}`}
          >
            {t('common.cancel')}
          </Button>

          <Button
            onClick={onConfirm}
            className="w-full sm:w-auto h-10 sm:h-12 rounded-lg bg-destructive hover:bg-destructive/90 text-white font-semibold shadow-md px-6"
          >
            {t('menuEditor.delete.btnDelete')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
