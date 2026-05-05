import { useState } from 'react';

import DirectMenuLink from "../qr/DirectMenuLink";
import QrDesignControls from "../qr/QrDesignControls";
import QrFrameControls from "../qr/QrFrameControls";
import QrPreview from "../qr/QrPreview";

const PRESET_COLORS = ['#08060d', '#863bff', '#ef4444', '#f97316', '#22c55e', '#3b82f6'];
const QR_VALUE = "https://kwikmenu.com/cafe-tatiana";
const QR_DISPLAY_VALUE = "kwikmenu.com/cafe-tatiana";

const VenueQrSection = () => {
  const [qrColor, setQrColor] = useState('#863bff');
  const [qrStyle, setQrStyle] = useState('rounded');
  const [logoFile, setLogoFile] = useState(null);
  const [hasFrame, setHasFrame] = useState(true);
  const [frameText, setFrameText] = useState('СКАНИРУЙ МЕНЮ');
  const [frameColor, setFrameColor] = useState('#08060d');

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];

    if (file) {
      setLogoFile(URL.createObjectURL(file));
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('kwikmenu-qr-canvas');

    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');

      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'kwikmenu-qr.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const copyMenuLink = async () => {
    try {
      await navigator.clipboard.writeText(QR_VALUE);
    } catch (error) {
      console.error('Не удалось скопировать ссылку', error);
    }
  };

  const previewProps = {
    qrValue: QR_VALUE,
    qrColor,
    qrStyle,
    logoFile,
    hasFrame,
    frameText,
    frameColor,
    onDownload: downloadQR,
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8">
        <h3 className="text-lg font-bold text-foreground">QR и публичная ссылка</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Для заведения используется один основной QR-код, который ведёт на публичное меню гостей.
        </p>
      </div>

      <div className="xl:hidden space-y-4">
        <QrPreview {...previewProps} mobile />
        <DirectMenuLink displayValue={QR_DISPLAY_VALUE} onCopy={copyMenuLink} />
      </div>

      <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 relative min-h-[calc(100vh-12rem)] w-full max-w-full min-w-0 overflow-x-hidden">
        <div className="flex-1 space-y-6 min-w-0 max-w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QrDesignControls
              qrColor={qrColor}
              qrStyle={qrStyle}
              logoFile={logoFile}
              presetColors={PRESET_COLORS}
              onQrColorChange={setQrColor}
              onQrStyleChange={setQrStyle}
              onLogoUpload={handleLogoUpload}
              onRemoveLogo={() => setLogoFile(null)}
            />

            <QrFrameControls
              hasFrame={hasFrame}
              frameText={frameText}
              frameColor={frameColor}
              presetColors={PRESET_COLORS}
              onHasFrameChange={setHasFrame}
              onFrameTextChange={setFrameText}
              onFrameColorChange={setFrameColor}
            />
          </div>
        </div>

        <div className="hidden xl:block w-full xl:w-[400px] shrink-0">
          <div className="sticky top-24 space-y-6">
            <QrPreview {...previewProps} />
            <DirectMenuLink displayValue={QR_DISPLAY_VALUE} onCopy={copyMenuLink} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueQrSection;
