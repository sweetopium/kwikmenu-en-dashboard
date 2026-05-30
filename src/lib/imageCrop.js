const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export const getCroppedImageBlob = async (
  imageSrc,
  pixelCrop,
  { maxSize = 1600, type = 'image/webp', quality = 0.86 } = {},
) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Не удалось подготовить холст для изображения.');
  }

  const cropWidth = Math.round(pixelCrop.width);
  const cropHeight = Math.round(pixelCrop.height);
  const scale = Math.min(1, maxSize / Math.max(cropWidth, cropHeight));

  canvas.width = Math.max(1, Math.round(cropWidth * scale));
  canvas.height = Math.max(1, Math.round(cropHeight * scale));

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (nextBlob) {
        resolve(nextBlob);
        return;
      }
      reject(new Error('Не удалось сформировать изображение после обрезки.'));
    }, type, quality);
  });

  return blob;
};
