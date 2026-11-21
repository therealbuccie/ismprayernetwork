async function run() {
  const base = 'https://ismprayernetwork-preview.pages.dev';
  console.log(`Checking base: ${base}`);

  const res = await fetch(base);
  console.log(`Status: ${res.status}`);
  const html = await res.text();
  console.log(`HTML size: ${html.length} bytes`);
  
  const re = /(?:src|href)="(\/assets\/[^"]+)"/g;
  let match;
  const assets = [];
  while ((match = re.exec(html)) !== null) {
    assets.push(match[1]);
  }

  console.log(`Found ${assets.length} linked assets in HTML`);
  for (const assetPath of assets) {
    const assetRes = await fetch(base + assetPath);
    console.log(`Asset: ${assetPath} -> Status: ${assetRes.status} (${assetRes.headers.get('content-type')})`);
  }

  // Check SPA routes
  const routes = ['/live-tv', '/bookstore', '/prayer-room', '/donate', '/prayer-wall', '/auth'];
  for (const route of routes) {
    const rRes = await fetch(base + route);
    console.log(`Route: ${route} -> Status: ${rRes.status}`);
  }
}

run().catch(console.error);
