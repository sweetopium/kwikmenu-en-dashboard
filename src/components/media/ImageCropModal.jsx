import { useState } from 'react';
import Cropper from 'react-easy-crop';
import { X } from 'lucide-react';
import 'react-easy-crop/react-easy-crop.css';

import { Button } from "../ui/button";

const ImageCropModal = ({ imageSrc, onCancel, onConfirm, isSubmitting = false }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  if (!imageSrc) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 bg-secondary/20 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-foreground">Обрезать фото блюда</h2>
            <p className="mt-1 text-xs text-muted-foreground">Выберите кадр. Сохраним оптимизированную версию и подставим ссылку в блюдо.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="relative h-[340px] overflow-hidden rounded-3xl bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              cropShape="rect"
              showGrid={false}
              objectFit="contain"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, nextCroppedAreaPixels) => setCroppedAreaPixels(nextCroppedAreaPixels)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Масштаб</span>
              <span>{zoom.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-brand-purple"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" className="sm:flex-1" onClick={onCancel} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button
              type="button"
              className="sm:flex-1"
              onClick={() => croppedAreaPixels && onConfirm(croppedAreaPixels)}
              disabled={!croppedAreaPixels || isSubmitting}
            >
              {isSubmitting ? 'Загружаем...' : 'Сохранить фото'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
