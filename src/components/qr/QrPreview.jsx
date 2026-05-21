import { useTranslation } from 'react-i18next';
import { FileDown } from 'lucide-react';
import { QRCode } from 'react-qrcode-logo';
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { primaryActionButtonClasses } from "../../lib/uiStyles";

const QrPreview = ({
  mobile = false,
  qrValue,
  qrColor,
  qrStyle,
  logoFile,
  hasFrame,
  frameText,
  frameColor,
  onDownload,
}) => {
  const { t } = useTranslation();

  return (
    <div className={`bg-card border border-border/60 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center ${
      mobile ? 'p-5' : 'p-8'
    }`}>
      <div className="w-full flex items-center justify-between gap-3 mb-4">
        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {t('qr.preview.title', 'Предпросмотр')}
        </Label>

        {mobile && (
          <div className="text-[10px] font-bold text-brand-purple bg-brand-purple/10 px-2.5 py-1 rounded-full">
            Live
          </div>
        )}
      </div>

      <div
        className={`bg-white rounded-2xl transition-all duration-300 ${
          hasFrame ? 'shadow-lg border-2' : 'shadow-sm border border-border/30'
        } ${mobile ? 'p-3' : 'p-4'}`}
        style={{ borderColor: hasFrame ? frameColor : 'transparent' }}
      >
        <div className="flex justify-center bg-white rounded-lg overflow-hidden">
          <QRCode
            id={mobile ? 'kwikmenu-qr-canvas-mobile' : 'kwikmenu-qr-canvas'}
            value={qrValue}
            size={mobile ? 176 : 200}
            fgColor={qrColor}
            bgColor="#ffffff"
            qrStyle={qrStyle === 'dots' ? 'dots' : 'squares'}
            eyeRadius={qrStyle === 'rounded' ? 10 : qrStyle === 'dots' ? 10 : 0}
            logoImage={logoFile}
            logoWidth={mobile ? 42 : 50}
            logoHeight={mobile ? 42 : 50}
            logoPadding={4}
            logoPaddingStyle="circle"
            removeQrCodeBehindLogo={true}
          />
        </div>

        {hasFrame && (
          <div
            className={`mt-3 rounded-xl font-black text-white px-4 transition-colors break-words ${
              mobile
                ? 'py-2 text-xs tracking-widest'
                : 'py-2.5 text-sm tracking-widest'
            }`}
            style={{ backgroundColor: frameColor }}
          >
            {frameText || t('qr.preview.defaultFrameText', 'СКАНИРУЙ МЕНЮ')}
          </div>
        )}
      </div>

      <div className={`space-y-3 w-full ${mobile ? 'mt-5' : 'mt-8'}`}>
        <Button
          onClick={onDownload}
          className={`w-full ${primaryActionButtonClasses} bg-foreground hover:bg-foreground/90 text-background`}
        >
          <FileDown size={18} className="mr-2" />
          {t('qr.preview.downloadPng', 'Скачать PNG')}
        </Button>
      </div>
    </div>
  );
};

export default QrPreview;
