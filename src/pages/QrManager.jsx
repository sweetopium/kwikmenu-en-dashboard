import { useState } from 'react';
import {
  Download, Palette, Type, Image as ImageIcon,
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

  const qrValue = "https://kwikmenu.com/cafe-tatiana"; // Мок-ссылка

  // Обработка загрузки логотипа
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
  };

  // Функция скачивания QR-кода
  const downloadQR = () => {
    const canvas = document.getElementById('kwikmenu-qr-canvas');
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');

      let downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'kwikmenu-qr.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className=" flex flex-col xl:flex-row gap-6 lg:gap-8 relative min-h-[calc(100vh-8rem)]">

      {/* ЛЕВАЯ КОЛОНКА: НАСТРОЙКИ */}
      <div className="flex-1 space-y-6">

        {/* Заголовок */}
        <div className="bg-card border border-border/60 p-6 sm:p-8 rounded-3xl shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Управление QR-кодами</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            Настройте внешний вид QR-кода под стиль вашего заведения и скачайте его в высоком качестве для размещения на тейбл-тентах или наклейках.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* БЛОК 1: ДИЗАЙН */}
          <div className="bg-card border border-border/60 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                <Palette size={18} />
              </div>
              <h2 className="font-bold text-lg text-foreground">Дизайн кода</h2>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Форма элементов</Label>
              <div className="grid grid-cols-3 gap-2 bg-secondary/30 p-1 rounded-xl border border-input/50">
                <button
                  onClick={() => setQrStyle('square')}
                  className={`py-2 text-sm font-medium rounded-lg transition-all ${qrStyle === 'square' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >Квадраты</button>
                <button
                  onClick={() => setQrStyle('rounded')}
                  className={`py-2 text-sm font-medium rounded-lg transition-all ${qrStyle === 'rounded' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >Мягкие</button>
                <button
                  onClick={() => setQrStyle('dots')}
                  className={`py-2 text-sm font-medium rounded-lg transition-all ${qrStyle === 'dots' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >Точки</button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Цвет узора</Label>
              <div className="flex items-center gap-3">
                {presetColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setQrColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${qrColor === color ? 'border-foreground shadow-md' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <div className="h-6 w-px bg-border mx-1"></div>
                <div className="relative">
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                  <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-secondary cursor-pointer overflow-hidden">
                    <div className="w-full h-full" style={{ backgroundColor: qrColor }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Логотип в центре</Label>
              <div className="flex items-center gap-4">
                {logoFile ? (
                  <div className="relative w-16 h-16 rounded-xl border border-border bg-secondary/50 flex items-center justify-center overflow-hidden shadow-sm group">
                    <img src={logoFile} alt="Uploaded Logo" className="w-full h-full object-contain p-2" />
                    <button
                      onClick={removeLogo}
                      className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12}/>
                    </button>
                  </div>
                ) : (
                  <div className="relative w-16 h-16 rounded-xl border-2 border-dashed border-input bg-secondary/20 hover:bg-secondary/50 flex items-center justify-center cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <ImageIcon size={20} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Загрузите иконку</p>
                  <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG до 2 МБ</p>
                </div>
              </div>
            </div>

          </div>

          {/* БЛОК 2: РАМКА И CTA */}
          <div className="bg-card border border-border/60 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                  <Type size={18} />
                </div>
                <h2 className="font-bold text-lg text-foreground">Рамка и текст</h2>
              </div>
              <Switch checked={hasFrame} onCheckedChange={setHasFrame} className="data-[state=checked]:bg-orange-500" />
            </div>

            <div className={`space-y-5 transition-opacity ${!hasFrame ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Призыв к действию</Label>
                <Input
                  value={frameText}
                  onChange={(e) => setFrameText(e.target.value)}
                  placeholder="Например: СКАНИРУЙ МЕНЮ"
                  className="h-11 bg-secondary/30 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Цвет рамки</Label>
                <div className="flex items-center gap-3">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setFrameColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${frameColor === color ? 'border-foreground shadow-md' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>


      {/* ПРАВАЯ КОЛОНКА: ПРЕВЬЮ И ЭКСПОРТ (Sticky) */}
      <div className="w-full xl:w-[400px] shrink-0">
        <div className="sticky top-24 space-y-6">

          {/* Превью Карточка */}
          <div className="bg-card border border-border/60 rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center text-center">

            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-6">Предпросмотр</Label>

            {/* Враппер для Рамки */}
            <div
              className={`p-4 bg-white rounded-2xl transition-all duration-300 ${hasFrame ? 'shadow-lg border-2' : 'shadow-sm border border-border/30'}`}
              style={{ borderColor: hasFrame ? frameColor : 'transparent' }}
            >

              {/* РЕАЛЬНЫЙ QR-КОД */}
              <div className="flex justify-center bg-white rounded-lg overflow-hidden">
                <QRCode
                  id="kwikmenu-qr-canvas"
                  value={qrValue}
                  size={200}
                  fgColor={qrColor}
                  bgColor="#ffffff"
                  qrStyle={qrStyle === 'dots' ? 'dots' : 'squares'}
                  eyeRadius={qrStyle === 'rounded' ? 10 : qrStyle === 'dots' ? 10 : 0}
                  logoImage={logoFile}
                  logoWidth={50}
                  logoHeight={50}
                  logoPadding={4}
                  logoPaddingStyle="circle"
                  removeQrCodeBehindLogo={true}
                />
              </div>

              {hasFrame && (
                <div
                  className="mt-4 py-2.5 rounded-xl font-black text-sm tracking-widest text-white px-4 transition-colors break-words"
                  style={{ backgroundColor: frameColor }}
                >
                  {frameText || 'СКАНИРУЙ МЕНЮ'}
                </div>
              )}
            </div>

            <div className="mt-8 space-y-3 w-full">
              <Button
                onClick={downloadQR}
                className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background rounded-xl font-bold text-sm shadow-md"
              >
                <FileDown size={18} className="mr-2" />
                Скачать PNG
              </Button>
            </div>

          </div>

          {/* Быстрая ссылка */}
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="truncate pr-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Прямая ссылка на меню</p>
              <p className="text-sm font-medium text-brand-purple truncate">kwikmenu.com/cafe-tatiana</p>
            </div>
            <button className="w-10 h-10 shrink-0 bg-secondary hover:bg-secondary/80 rounded-xl flex items-center justify-center text-foreground transition-colors border border-border/50 shadow-sm">
              <Copy size={16} />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default QrManager;