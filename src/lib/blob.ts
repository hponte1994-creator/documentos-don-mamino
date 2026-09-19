import { put, del } from '@vercel/blob';

export async function subirImagen(archivo: File, carpeta: string) {
  const nombre = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const resultado = await put(nombre, archivo, { access: 'public', contentType: archivo.type || 'image/jpeg' });
  return { url: resultado.url, pathname: resultado.pathname };
}

export async function eliminarImagen(pathname: string) {
  await del(pathname);
}
