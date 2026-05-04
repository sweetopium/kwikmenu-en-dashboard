import { useState } from 'react';
import {
  Palette, Type, Image as ImageIcon,
  Copy, FileDown, X
} from 'lucide-react';
import { QRCode } from 'react-qrcode-logo';

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";

const QrManager = () => {
  // Состояния дизайна QR
  const [qrColor, setQrColor] = useState('#863bff');
  const [qrStyle, setQrStyle] = useState('rounded'); // 'square' | 'rounded' | 'dots'
  const [logoFile, setLogoFile] = useState(null);

  // Состояния рамки
  const [hasFrame, setHasFrame] = useState(true);
  const [frameText, setFrameText] = useState('СКАНИРУЙ МЕНЮ');
  const [frameColor, setFrameColor] = useState('#08060d');

  const presetColors = ['#08060d', '#863bff', '#ef4444', '#f97316', '#22c55e', '#3b82f6'];

  const qrValue = "https://kwikmenu.com/cafe-tatiana";

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];

    if (file) {
      setLogoFile(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
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
      await navigator.clipboard.writeText(qrValue);
    } catch (error) {
      console.error('Не удалось скопировать ссылку', error);
    }
  };

  const QrPreviewCard = ({ mobile = false }) => (
    <div className={`bg-card border border-border/60 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center ${
      mobile ? 'p-5' : 'p-8'
    }`}>
      <div className="w-full flex items-center justify-between gap-3 mb-4">
        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Предпросмотр
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
            {frameText || 'СКАНИРУЙ МЕНЮ'}
          </div>
        )}
      </div>

      <div className={`space-y-3 w-full ${mobile ? 'mt-5' : 'mt-8'}`}>
        <Button
          onClick={downloadQR}
          className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background rounded-xl font-bold text-sm shadow-md"
        >
          <FileDown size={18} className="mr-2" />
          Скачать PNG
        </Button>
      </div>
    </div>
  );

  const DirectLinkCard = () => (
    <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm flex items-center justify-between min-w-0">
      <div className="truncate pr-4 min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
          Прямая ссылка на меню
        </p>
        <p className="text-sm font-medium text-brand-purple truncate">
          kwikmenu.com/cafe-tatiana
        </p>
      </div>

      <button
        onClick={copyMenuLink}
        className="w-10 h-10 shrink-0 bg-secondary hover:bg-secondary/80 rounded-xl flex items-center justify-center text-foreground transition-colors border border-border/50 shadow-sm"
      >
        <Copy size={16} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 relative min-h-[calc(100vh-8rem)] w-full max-w-full min-w-0 overflow-x-hidden">

      {/* ОСНОВНАЯ КОЛОНКА */}
      <div className="flex-1 space-y-6 min-w-0 max-w-full">

        {/* Заголовок */}
        <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-3xl shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Управление QR-кодами
          </h1>

          <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            Настройте внешний вид QR-кода под стиль вашего заведения и скачайте его в высоком качестве для размещения на тейбл-тентах или наклейках.
          </p>
        </div>

        {/* МОБИЛЬНОЕ ПРЕВЬЮ: наверху, сразу после заголовка */}
        <div className="xl:hidden space-y-4">
          <QrPreviewCard mobile />
          <DirectLinkCard />
        </div>

        {/* НАСТРОЙКИ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* БЛОК 1: ДИЗАЙН */}
          <div className="bg-card border border-border/60 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-purple/10 text-brand-purple flex items-center justify-center shrink-0">
                <Palette size={18} />
              </div>

              <h2 className="font-bold text-lg text-foreground">
                Дизайн кода
              </h2>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Форма элементов
              </Label>

              <div className="grid grid-cols-3 gap-2 bg-secondary/30 p-1 rounded-xl border border-input/50">
                <button
                  onClick={() => setQrStyle('square')}
                  className={`py-2 text-sm font-medium rounded-lg transition-all ${
                    qrStyle === 'square'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Квадраты
                </button>

                <button
                  onClick={() => setQrStyle('rounded')}
                  className={`py-2 text-sm font-medium rounded-lg transition-all ${
                    qrStyle === 'rounded'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Мягкие
                </button>

                <button
                  onClick={() => setQrStyle('dots')}
                  className={`py-2 text-sm font-medium rounded-lg transition-all ${
                    qrStyle === 'dots'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Точки
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Цвет узора
              </Label>

              <div className="flex items-center gap-3 flex-wrap">
                {presetColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setQrColor(color)}
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
                    onChange={(e) => setQrColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: qrColor }}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Логотип в центре
              </Label>

              {logoFile ? (
                <div className="flex items-center gap-4 p-3 bg-secondary/20 border border-border/60 rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={logoFile}
                      alt="Логотип"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground truncate">
                      Логотип загружен
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Он появится в центре QR-кода.
                    </p>
                  </div>

                  <button
                    onClick={removeLogo}
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
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  <div className="w-16 h-16 rounded-2xl bg-secondary/40 border border-border/50 flex items-center justify-center shrink-0">
                    <ImageIcon size={24} className="text-muted-foreground" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      Загрузите иконку
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      PNG, JPG до 2 МБ
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* БЛОК 2: РАМКА И ТЕКСТ */}
          <div className="bg-card border border-border/60 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                  <Type size={18} />
                </div>

                <h2 className="font-bold text-lg text-foreground truncate">
                  Рамка и текст
                </h2>
              </div>

              <Switch
                checked={hasFrame}
                onCheckedChange={setHasFrame}
                className="data-[state=checked]:bg-orange-500 shrink-0"
              />
            </div>

            <div className={hasFrame ? 'space-y-6' : 'space-y-6 opacity-40 pointer-events-none'}>
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Призыв к действию
                </Label>

                <Input
                  value={frameText}
                  onChange={(e) => setFrameText(e.target.value)}
                  className="h-11 bg-secondary/30 border-input/60 rounded-xl text-base font-medium"
                  placeholder="Например: СКАНИРУЙ МЕНЮ"
                  maxLength={24}
                />

                <p className="text-[11px] text-muted-foreground">
                  Лучше коротко: 1–3 слова, чтобы хорошо читалось на наклейке.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Цвет рамки
                </Label>

                <div className="flex items-center gap-3 flex-wrap">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setFrameColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        frameColor === color ? 'border-foreground shadow-md' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}

                  <label className="w-8 h-8 rounded-full border-2 border-border/60 overflow-hidden cursor-pointer shadow-sm relative">
                    <input
                      type="color"
                      value={frameColor}
                      onChange={(e) => setFrameColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: frameColor }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ДЕСКТОПНОЕ ПРЕВЬЮ: справа sticky */}
      <div className="hidden xl:block w-full xl:w-[400px] shrink-0">
        <div className="sticky top-24 space-y-6">
          <QrPreviewCard />
          <DirectLinkCard />
        </div>
      </div>

    </div>
  );
};

export default QrManager;