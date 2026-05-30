import DirectMenuLink from "../qr/DirectMenuLink";
import QrDesignControls from "../qr/QrDesignControls";
import QrFrameControls from "../qr/QrFrameControls";
import QrPreview from "../qr/QrPreview";
import { Button } from "../ui/button";
import { Save } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { primaryActionButtonClasses } from "../../lib/uiStyles";

const PRESET_COLORS = ['#08060d', '#863bff', '#ef4444', '#f97316', '#22c55e', '#3b82f6'];

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const VenueQrSection = ({ value, onChange, onSave, onDownload, onOpenPublicLink, isSaving = false }) => {
  const { t } = useTranslation();
  const qrValue = value.publicUrl || '';
  const qrDisplayValue = qrValue.replace(/^https?:\/\//, '');

  const handleQrLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    if (dataUrl) {
      onChange({ ...value, logoUrl: dataUrl });
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('kwikmenu-qr-canvas') || document.getElementById('kwikmenu-qr-canvas-mobile');

    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');

      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `kwikmenu-${value.venueId || 'venue'}-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      onDownload?.();
    }
  };

  const previewProps = {
    qrValue,
    qrColor: value.color,
    qrStyle: value.style,
    logoFile: value.logoUrl,
    hasFrame: value.hasFrame,
    frameText: value.frameText,
    frameColor: value.frameColor,
    onDownload: downloadQR,
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-border/50">
          <h3 className="text-lg font-bold text-foreground">{t('venues.qr.title', 'QR и публичная ссылка')}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {t('venues.qr.subtitle', 'Для заведения используется один основной QR-код, который ведёт на публичное меню гостей.')}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="xl:hidden space-y-4 mb-6">
            <QrPreview {...previewProps} mobile />
            <DirectMenuLink embedded displayValue={qrDisplayValue} href={qrValue} action="open" onOpen={onOpenPublicLink} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-8 relative w-full max-w-full min-w-0">
            <div className="space-y-8 min-w-0 max-w-full">
              <QrDesignControls
                embedded
                qrColor={value.color}
                qrStyle={value.style}
                logoFile={value.logoUrl}
                presetColors={PRESET_COLORS}
                onQrColorChange={(nextColor) => onChange({ ...value, color: nextColor })}
                onQrStyleChange={(nextStyle) => onChange({ ...value, style: nextStyle })}
                onLogoUpload={handleQrLogoUpload}
                onRemoveLogo={() => onChange({ ...value, logoUrl: null })}
              />

              <div className="border-t border-border/50" />

              <QrFrameControls
                embedded
                hasFrame={value.hasFrame}
                frameText={value.frameText}
                frameColor={value.frameColor}
                presetColors={PRESET_COLORS}
                onHasFrameChange={(nextHasFrame) => onChange({ ...value, hasFrame: nextHasFrame })}
                onFrameTextChange={(nextFrameText) => onChange({ ...value, frameText: nextFrameText })}
                onFrameColorChange={(nextFrameColor) => onChange({ ...value, frameColor: nextFrameColor })}
              />

              <div className="border-t border-border/50" />

              <div className="flex justify-start">
                <Button
                  onClick={onSave}
                  disabled={isSaving}
                  className={`${primaryActionButtonClasses} px-5`}
                >
                  <Save size={18} className="mr-2" />
                  {isSaving ? t('common.saving', 'Сохраняем...') : t('venues.qr.btnSave', 'Сохранить QR')}
                </Button>
              </div>
            </div>

            <div className="hidden xl:block w-full shrink-0 self-start">
              <div className="sticky top-24 space-y-4">
                <QrPreview {...previewProps} />
                <DirectMenuLink embedded displayValue={qrDisplayValue} href={qrValue} action="open" onOpen={onOpenPublicLink} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueQrSection;
