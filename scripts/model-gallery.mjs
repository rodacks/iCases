import { chromium } from '@playwright/test';
import { readFile, readdir, mkdir } from 'node:fs/promises';
const directory='test-results/preview-los-16-modelos-renderizan-en-3D-y-responden-al-giro-desktop';
const files=(await readdir(directory)).filter(f=>f.endsWith('.png'));
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1200,height:1500}});
const images=await Promise.all(files.map(async file=>`<figure><figcaption>${file.replace('.png','')}</figcaption><img src="data:image/png;base64,${(await readFile(directory+'/'+file)).toString('base64')}"></figure>`));
await page.setContent(`<body style="margin:0;background:#eff1e9;font:600 16px Arial;display:grid;grid-template-columns:repeat(4,1fr)"><style>figure{margin:0;text-align:center;padding:16px 0}img{width:300px;height:320px;object-fit:contain}</style>${images.join('')}</body>`);
await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
await mkdir('test-results/visual',{recursive:true});await page.screenshot({path:'test-results/visual/modelos-16.png',fullPage:true});
await page.goto('http://127.0.0.1:3000/tienda/lilac');
await page.locator('.case-preview[data-preview-status=ready]').waitFor();
for(const id of ['iphone-13-mini','iphone-14-pro','iphone-16']){
 await page.getByLabel('Tu modelo de iPhone').selectOption(id);
 await page.waitForFunction(id=>JSON.parse(document.querySelector('.case-preview').dataset.renderedConfig||'{}').modelId===id,id);
 await page.getByRole('button',{name:'Restablecer vista 3D'}).click();
 for(let n=0;n<6;n++)await page.getByRole('button',{name:'Girar funda a la derecha'}).click();
 await page.locator('.three-viewport canvas').screenshot({path:`test-results/visual/frente-${id}.png`});
}
await browser.close();
