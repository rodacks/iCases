import { chromium, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results/visual',{recursive:true});
const browser=await chromium.launch();
for(const [name,options] of [['desktop',{viewport:{width:1440,height:1000}}],['mobile',{...devices['iPhone 13']}]]){
 const page=await browser.newPage(options);page.on('pageerror',e=>console.error('ERROR',e.message));page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text());});
 await page.goto('http://127.0.0.1:3000/');
 await page.locator('.case-front .case-preview[data-preview-status=ready]').waitFor({timeout:60000});
 await page.screenshot({path:`test-results/visual/${name}-home-3d.png`,fullPage:true});
 await page.goto('http://127.0.0.1:3000/tienda/lilac');await page.locator('.case-preview[data-preview-status=ready]').waitFor({timeout:60000});
 await page.screenshot({path:`test-results/visual/${name}-product-3d.png`,fullPage:true});
 await page.goto('http://127.0.0.1:3000/personalizar');await page.getByLabel('Modelo de iPhone',{exact:true}).selectOption('iphone-16-pro');await page.getByRole('button',{name:'Vista 3D',exact:true}).click();
 await page.locator('.case-preview[data-preview-status=ready]').waitFor({timeout:60000});await page.screenshot({path:`test-results/visual/${name}-editor-3d.png`,fullPage:false});
 console.log(name,'3D rendered',await page.locator('.three-viewport canvas').boundingBox());await page.close();
}
await browser.close();
