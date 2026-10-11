import { chromium } from '@playwright/test';
import { phoneProfiles } from '../src/lib/phone-profiles.ts';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('test-results/references',{recursive:true});
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1400,height:1600}});
const entries=Object.entries(phoneProfiles);
for(let start=0; start<16; start+=4){
 await page.setContent(`<html><body style="font:20px Arial;display:grid;grid-template-columns:1fr 1fr;gap:24px">${entries.slice(start,start+4).map(([id,p])=>`<section><h2>${id}</h2><img style="width:640px;height:570px;object-fit:contain" src="${p.image}"></section>`).join('')}</body></html>`);
 await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 await page.screenshot({path:`test-results/references/generation-${13+start/4}.png`});
}
await mkdir('docs',{recursive:true});
await writeFile('docs/iphone-references.md',`# Referencias de los modelos de iPhone\n\nConsultadas el 11 de octubre de 2026. Fotografías oficiales enlazadas desde [Identificar el modelo de iPhone](https://support.apple.com/en-us/108044). Se usan para observación; no se distribuyen como texturas ni recursos de la tienda.\n\n| Modelo | Ancho × alto × profundidad (mm) | Referencia visual | Ficha oficial |\n|---|---|---|---|\n`+entries.map(([id,p])=>`| ${id} | ${p.width} × ${p.height} × ${p.depth} | [Imagen Apple](${p.image}) | [Especificaciones](${p.specs}) |`).join('\n')+'\n\nLas dimensiones del cuerpo proceden de las fichas. Radios, posiciones y relieves de cámaras, botones y funda son aproximaciones visuales, no planos de fabricación. La funda añade un borde protector. Las diferencias regionales de bandeja SIM no se modelan.\n');
await browser.close();
