export async function rasterizeSvg(svg: SVGSVGElement, scale = 4) {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.querySelectorAll('[data-editor-ui]').forEach((n) => n.remove());
  for (const node of Array.from(copy.querySelectorAll('image'))) {
    const response = await fetch(node.getAttribute('href')!);
    if (!response.ok) throw new Error('No se pudo recuperar una imagen del diseño');
    const blob = await response.blob();
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    node.setAttribute('href', url);
  }
  const view = svg.viewBox.baseVal;
  copy.setAttribute('width', String(view.width * scale));
  copy.setAttribute('height', String(view.height * scale));
  const blob = new Blob([new XMLSerializer().serializeToString(copy)], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('No se pudo exportar el diseño'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = view.width * scale;
    canvas.height = view.height * scale;
    canvas.getContext('2d')!.drawImage(img, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function exportPng(svg: SVGSVGElement, name: string) {
  const canvas = await rasterizeSvg(svg);
  const png = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('No se pudo crear el PNG'))),
      'image/png',
    ),
  );
  downloadBlob(png, name);
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
