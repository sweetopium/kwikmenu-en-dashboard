import { FileText, Image as ImageIcon, Link as LinkIcon, UploadCloud } from 'lucide-react';
import { Input } from "../ui/input";

const MenuSourcePicker = ({
  menuSource,
  onMenuSourceChange,
  onFileChange,
  files = [],
  fileName = '',
  menuLink,
  onMenuLinkChange,
  inputClassName,
  multiple = false,
  fileTabLabel = 'Загрузить файл',
  fileTabMobileLabel = 'Файл',
  linkPlaceholder = 'Ссылка на Google Drive...',
  dropzoneHeight = 'h-24 sm:h-28',
}) => {
  const selectedFileLabel = multiple
    ? files.length === 1
      ? files[0].name
      : `Выбрано файлов: ${files.length}`
    : fileName;
  const hasFiles = multiple ? files.length > 0 : Boolean(fileName);

  return (
    <div className="space-y-2 sm:space-y-3 animate-in fade-in duration-300">
      <div className="flex p-1 bg-secondary/50 rounded-lg border border-input/50">
        <button
          type="button"
          onClick={() => onMenuSourceChange('file')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md text-[10px] sm:text-sm font-medium transition-all ${
            menuSource === 'file'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <UploadCloud size={14} className="sm:w-[18px] sm:h-[18px]" />
          <span className="hidden sm:inline">{fileTabLabel}</span>
          <span className="sm:hidden">{fileTabMobileLabel}</span>
        </button>
        <button
          type="button"
          onClick={() => onMenuSourceChange('link')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md text-[10px] sm:text-sm font-medium transition-all ${
            menuSource === 'link'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LinkIcon size={14} className="sm:w-[18px] sm:h-[18px]" />
          <span className="hidden sm:inline">Указать ссылку</span>
          <span className="sm:hidden">Ссылка</span>
        </button>
      </div>

      {menuSource === 'file' ? (
        <div className={`relative flex flex-col items-center justify-center w-full ${dropzoneHeight} border-2 border-dashed border-input rounded-lg hover:bg-secondary/20 transition-colors bg-secondary/10 group cursor-pointer overflow-hidden`}>
          <input
            type="file"
            multiple={multiple}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={onFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          {hasFiles ? (
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-brand-purple px-4 text-center">
              {multiple && files.length > 1 ? (
                <ImageIcon size={28} className="sm:w-8 sm:h-8" />
              ) : (
                <FileText size={multiple ? 28 : 22} className={multiple ? 'sm:w-8 sm:h-8' : 'sm:w-7 sm:h-7'} />
              )}
              <span className="text-[10px] sm:text-sm font-medium truncate max-w-[200px] sm:max-w-[300px]">
                {selectedFileLabel}
              </span>
              {multiple && (
                <span className="text-[10px] sm:text-xs text-muted-foreground group-hover:text-brand-purple/70 transition-colors">
                  Нажмите, чтобы заменить
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-muted-foreground group-hover:text-foreground transition-colors px-4 text-center">
              <UploadCloud size={multiple ? 24 : 18} className={multiple ? 'sm:w-7 sm:h-7' : 'sm:w-6 sm:h-6'} />
              <span className="text-[10px] sm:text-sm font-medium">
                {multiple ? 'Нажмите или перетащите PDF/Фото' : 'Нажмите или перетащите файл'}
              </span>
              {multiple && <span className="text-[10px] sm:text-xs opacity-70">Можно выбрать несколько файлов</span>}
            </div>
          )}
        </div>
      ) : (
        <Input
          placeholder={linkPlaceholder}
          value={menuLink}
          onChange={(e) => onMenuLinkChange(e.target.value)}
          required={menuSource === 'link'}
          className={inputClassName}
        />
      )}
    </div>
  );
};

export default MenuSourcePicker;
