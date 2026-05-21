import { Image as ImageIcon, Palette, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Label } from "../ui/label";

const QrDesignControls = ({
  embedded = false,
  qrColor,
  qrStyle,
  logoFile,
  presetColors,
  onQrColorChange,
  onQrStyleChange,
  onLogoUpload,
  onRemoveLogo,
}) => {
  const { t } = useTranslation();

  const shapes = {
    square: t('qr.design.shapes.square', 'Квадраты'),
    rounded: t('qr.design.shapes.rounded', 'Мягкие'),
    dots: t('qr.design.shapes.dots', 'Точки'),
  };

  return (
    <div className={`${embedded ? 'space-y-6' : 'bg-card border border-border/60 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6'}`}>
      <div className={`flex items-center gap-3 ${embedded ? '' : 'border-b border-border/50 pb-4'}`}>
        <div className="w-8 h-8 rounded-lg bg-brand-purple/10 text-brand-purple flex items-center justify-center shrink-0">
          <Palette size={18} />
        </div>

        <div>
          <h2 className="font-bold text-lg text-foreground">
            {t('qr.design.title', 'Дизайн кода')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('qr.design.subtitle', 'Настройте форму элементов, цвет и логотип в центре.')}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('qr.design.shapeLabel', 'Форма элементов')}
        </Label>

        <div className="grid grid-cols-3 gap-2 bg-secondary/30 p-1 rounded-xl border border-input/50">
          {[
            { value: 'square', label: shapes.square },
            { value: 'rounded', label: shapes.rounded },
            { value: 'dots', label: shapes.dots },
          ].map((style) => (
            <button
              key={style.value}
              onClick={() => onQrStyleChange(style.value)}
              className={`py-2 text-sm font-medium rounded-lg transition-all ${
                qrStyle === style.value
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('qr.design.colorLabel', 'Цвет узора')}
        </Label>

        <div className="flex items-center gap-3 flex-wrap">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => onQrColorChange(color)}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                qrColor === color ? 'border-foreground shadow-md' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}

          <label className="w-8 h-8 rounded-full border-2 border-border/60 overflow-hidden cursor-pointer shadow-sm relative">
            <input
              type="color"
              value={qrColor}
              onChange={(e) => onQrColorChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-full h-full" style={{ backgroundColor: qrColor }} />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('qr.design.logoLabel', 'Логотип в центре')}
        </Label>

        {logoFile ? (
          <div className="flex items-center gap-4 p-3 bg-secondary/20 border border-border/60 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-white border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
              <img src={logoFile} alt={t('qr.design.logoAlt', 'Логотип')} className="w-full h-full object-cover" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">
                {t('qr.design.logoUploaded', 'Логотип загружен')}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('qr.design.logoHint', 'Он появится в центре QR-кода.')}
              </p>
            </div>

            <button
              onClick={onRemoveLogo}
              className="w-8 h-8 rounded-xl bg-background border border-border/60 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-4 p-3 border border-dashed border-border rounded-2xl cursor-pointer hover:border-brand-purple/50 hover:bg-brand-purple/5 transition-all">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={onLogoUpload}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-secondary/40 border border-border/50 flex items-center justify-center shrink-0">
              <ImageIcon size={24} className="text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">
                {t('qr.design.logoUploadTitle', 'Загрузите иконку')}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('qr.design.logoUploadDesc', 'PNG, JPG до 2 МБ')}
              </p>
            </div>
          </label>
        )}
      </div>
    </div>
  );
};

export default QrDesignControls;
