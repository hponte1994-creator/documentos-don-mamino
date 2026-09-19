const LADO_MAYOR_MAXIMO = 1500;
const CALIDAD_JPEG = 0.8;

/**
 * Reduce una foto (de cámara o WhatsApp, normalmente pesada) a un JPEG
 * de máximo 1500px de lado mayor, para que la subida sea rápida en
 * conexiones lentas de tienda.
 */
export async function comprimirImagen(archivo: File): Promise<File> {
  if (!archivo.type.startsWith('image/')) return archivo;

  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAYOR_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const contexto = canvas.getContext('2d');
  if (!contexto) return archivo;
  contexto.drawImage(bitmap, 0, 0, ancho, alto);

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', CALIDAD_JPEG));
  if (!blob) return archivo;

  const nombre = archivo.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], nombre, { type: 'image/jpeg' });
}
