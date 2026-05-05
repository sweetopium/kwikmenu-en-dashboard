import { Type } from 'lucide-react';
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { formFieldClasses } from "../../lib/uiStyles";

const QrFrameControls = ({
  embedded = false,
  hasFrame,
  frameText,
  frameColor,
  presetColors,
  onHasFrameChange,
  onFrameTextChange,
  onFrameColorChange,
}) => (
  <div className={`${embedded ? 'space-y-6' : 'bg-card border border-border/60 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6'}`}>
    <div className={`flex items-center justify-between gap-3 ${embedded ? '' : 'border-b border-border/50 pb-4'}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
          <Type size={18} />
        </div>

        <div className="min-w-0">
          <h2 className="font-bold text-lg text-foreground">
            Рамка и текст
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Добавьте короткий призыв к действию и цвет для печатной версии QR.
          </p>
        </div>
      </div>

      <Switch
        checked={hasFrame}
        onCheckedChange={onHasFrameChange}
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
          onChange={(e) => onFrameTextChange(e.target.value)}
          className={formFieldClasses}
          placeholder="Например: СКАНИРУЙ МЕНЮ"
          maxLength={24}
        />

        <p className="text-[11px] text-muted-foreground">
          Лучше коротко: 1-3 слова, чтобы хорошо читалось на наклейке.
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Цвет рамки
        </Label>

        <div className="flex items-center gap-3 flex-wrap">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => onFrameColorChange(color)}
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
              onChange={(e) => onFrameColorChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-full h-full" style={{ backgroundColor: frameColor }} />
          </label>
        </div>
      </div>
    </div>
  </div>
);

export default QrFrameControls;
