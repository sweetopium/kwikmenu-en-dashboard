import { FileText, Image as ImageIcon, Link as LinkIcon, UploadCloud } from 'lucide-react';
import { Input } from "../ui/input";
import { useTranslation } from "react-i18next";

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
  fileTabLabel,
  fileTabMobileLabel,
  linkPlaceholder,
  dropzoneHeight = 'h-24 sm:h-28',
}) => {
  const { t } = useTranslation();
  const displayFileTabLabel = fileTabLabel !== undefined ? fileTabLabel : t('menuSource.fileTabLabel', { defaultValue: 'Upload file' });
  const displayFileTabMobileLabel = fileTabMobileLabel !== undefined ? fileTabMobileLabel : t('menuSource.fileTabMobileLabel', { defaultValue: 'File' });
  const displayLinkPlaceholder = linkPlaceholder !== undefined ? linkPlaceholder : t('menuSource.linkPlaceholder', { defaultValue: 'Direct link to menu PDF file' });

  const selectedFileLabel = multiple
    ? files.length === 1
      ? files[0].name
      : t('menuSource.selectedFilesCount', { count: files.length, defaultValue: `Selected files: ${files.length}` })
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
          <span className="hidden sm:inline">{displayFileTabLabel}</span>
          <span className="sm:hidden">{displayFileTabMobileLabel}</span>
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
          <span className="hidden sm:inline">{t('menuSource.linkTabLabel', { defaultValue: 'Specify link' })}</span>
          <span className="sm:hidden">{t('menuSource.linkTabMobileLabel', { defaultValue: 'Link' })}</span>
        </button>
      </div>

      {menuSource === 'file' ? (
        <div className={`relative flex flex-col items-center justify-center w-full ${dropzoneHeight} border-2 border-dashed border-input rounded-lg hover:bg-secondary/20 transition-colors bg-secondary/10 group cursor-pointer overflow-hidden`}>
          <input
            type="file"
            multiple={multiple}
            accept=".pdf,.jpg,.jpeg,.png,.webp"
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
                  {t('menuSource.clickToReplace', { defaultValue: 'Click to replace' })}
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-muted-foreground group-hover:text-foreground transition-colors px-4 text-center">
              <UploadCloud size={multiple ? 24 : 18} className={multiple ? 'sm:w-7 sm:h-7' : 'sm:w-6 sm:h-6'} />
              <span className="text-[10px] sm:text-sm font-medium">
                {multiple
                  ? t('menuSource.dragAndDropMultiple', { defaultValue: 'Click or drag & drop PDF/Photo' })
                  : t('menuSource.dragAndDropSingle', { defaultValue: 'Click or drag & drop file' })}
              </span>
              {multiple && <span className="text-[10px] sm:text-xs opacity-70">{t('menuSource.multipleFilesNote', { defaultValue: 'Multiple files can be selected' })}</span>}
            </div>
          )}
        </div>
      ) : (
        <Input
          placeholder={displayLinkPlaceholder}
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
