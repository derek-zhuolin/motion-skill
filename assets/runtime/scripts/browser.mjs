import {existsSync} from 'node:fs';
export function resolveBrowser(){
 const candidates=[process.env.REMOTION_BROWSER_EXECUTABLE,
 '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
 '/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser',
 process.env.PROGRAMFILES ? `${process.env.PROGRAMFILES}/Google/Chrome/Application/chrome.exe`:null];
 const found=candidates.find(p=>p&&existsSync(p));
 if(!found)throw Error('Chrome/Chromium missing. Install it yourself or set REMOTION_BROWSER_EXECUTABLE. No automatic browser download.');
 return found;
}
