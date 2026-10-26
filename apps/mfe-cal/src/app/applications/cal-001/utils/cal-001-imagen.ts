/** Lado mayor y calidades de la compresión (plan §4.3: objetivo < 1 MB, techo 1,5 MB, el back acepta 3 MB). */
export const ImagenConfig = {
  LadoMayor: 1600,
  Calidades: [0.82, 0.72, 0.62, 0.5],
  ObjetivoBytes: 1.5 * 1024 * 1024,
  MaximoBytes: 3 * 1024 * 1024
} as const;

export interface Cal001ImagenComprimida {
  nombre: string;
  base64: string;
  bytes: number;
}

/** Dimensiones escaladas para que el lado mayor no pase de `ladoMayor` (nunca amplía). */
export function escalar(ancho: number, alto: number, ladoMayor: number = ImagenConfig.LadoMayor): { ancho: number; alto: number } {
  const mayor = Math.max(ancho, alto);
  if (!mayor || mayor <= ladoMayor) return { ancho, alto };
  const factor = ladoMayor / mayor;
  return { ancho: Math.round(ancho * factor), alto: Math.round(alto * factor) };
}

/** Bytes reales de un base64 (sin prefijo data:). */
export function bytesBase64(base64: string): number {
  const limpio = base64.replace(/^data:[^,]*,/, '').replace(/\s/g, '');
  const relleno = limpio.endsWith('==') ? 2 : limpio.endsWith('=') ? 1 : 0;
  return Math.floor(limpio.length * 3 / 4) - relleno;
}

/** Nombre original con extensión .jpg (la foto se re-codifica a JPEG). */
export function nombreJpg(nombre: string): string {
  const base = (nombre || 'foto').replace(/\.[^.]*$/, '').slice(0, 240) || 'foto';
  return `${base}.jpg`;
}

async function decodificarImagen(archivo: Blob): Promise<{ fuente: CanvasImageSource; ancho: number; alto: number; cerrar: () => void }> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(archivo);
    return { fuente: bitmap, ancho: bitmap.width, alto: bitmap.height, cerrar: () => bitmap.close() };
  }
  const url = URL.createObjectURL(archivo);
  try {
    const imagen = new Image();
    imagen.src = url;
    await imagen.decode();
    return { fuente: imagen, ancho: imagen.naturalWidth, alto: imagen.naturalHeight, cerrar: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

/**
 * Comprime una foto en el navegador a JPEG (lado mayor 1600 px) bajando la calidad hasta quedar bajo el objetivo.
 * Rechaza si no se puede leer o si aun así supera 3 MB (el back respondería 413).
 */
export async function comprimirImagen(archivo: File): Promise<Cal001ImagenComprimida> {
  let imagen: Awaited<ReturnType<typeof decodificarImagen>>;
  try {
    imagen = await decodificarImagen(archivo);
  } catch {
    throw new Error(`No se pudo leer la imagen ${archivo.name}. Use una foto JPG, PNG o WEBP.`);
  }
  try {
    const { ancho, alto } = escalar(imagen.ancho, imagen.alto);
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const contexto = lienzo.getContext('2d');
    if (!contexto) throw new Error('El navegador no permite procesar imágenes.');
    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, ancho, alto);
    contexto.drawImage(imagen.fuente, 0, 0, ancho, alto);
    let base64 = '';
    let bytes = 0;
    for (const calidad of ImagenConfig.Calidades) {
      base64 = lienzo.toDataURL('image/jpeg', calidad).replace(/^data:[^,]*,/, '');
      bytes = bytesBase64(base64);
      if (bytes <= ImagenConfig.ObjetivoBytes) break;
    }
    if (!base64 || bytes > ImagenConfig.MaximoBytes) throw new Error(`La foto ${archivo.name} supera 3 MB aun comprimida.`);
    return { nombre: nombreJpg(archivo.name), base64, bytes };
  } finally {
    imagen.cerrar();
  }
}
