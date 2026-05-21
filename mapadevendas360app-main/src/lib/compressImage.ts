/**
 * Comprime e redimensiona imagens no navegador antes do upload.
 * - Converte para WebP (fallback JPEG) com qualidade ajustável
 * - Limita a maior dimensão (default 1920px)
 * - Mantém PNGs com transparência apenas se necessário (caso contrário, JPEG/WebP)
 */
export async function compressImage(
  file: File,
  opts: { maxDimension?: number; quality?: number } = {}
): Promise<File> {
  const { maxDimension = 1920, quality = 0.82 } = opts;

  // Apenas comprime imagens raster comuns
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return file;

  // Se já é pequeno (< 350KB), não vale recomprimir
  if (file.size < 350 * 1024) return file;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Falha ao carregar imagem"));
    i.src = dataUrl;
  });

  let { width, height } = img;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  const mime = "image/webp";
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, mime, quality)
  );
  if (!blob || blob.size >= file.size) return file;

  const newName = file.name.replace(/\.(png|jpe?g|webp)$/i, "") + ".webp";
  return new File([blob], newName, { type: mime, lastModified: Date.now() });
}