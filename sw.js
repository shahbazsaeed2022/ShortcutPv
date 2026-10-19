const SHELL='shortcuts-shell-v1';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim())});

self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method==='POST'&&u.pathname.endsWith('/share-target')){
    e.respondWith((async()=>{
      const fd=await e.request.formData();
      const c=await caches.open('share-inbox');
      let i=0;const stamp=Date.now();
      for(const f of fd.getAll('files')){
        if(!(f instanceof File))continue;
        await c.put(new Request(self.registration.scope+'inbox/'+stamp+'-'+(i++)),
          new Response(f,{headers:{'x-name':encodeURIComponent(f.name||'shared-file'),'content-type':f.type||'application/octet-stream'}}));
      }
      const text=[fd.get('title'),fd.get('text'),fd.get('url')].filter(Boolean).join('\n');
      if(text){
        const t=(fd.get('title')||'Shared text').toString().slice(0,40).replace(/[\\/:*?"<>|]/g,'_');
        await c.put(new Request(self.registration.scope+'inbox/'+stamp+'-t'),
          new Response(text,{headers:{'x-name':encodeURIComponent(t+'.txt'),'content-type':'text/plain'}}));
      }
      return Response.redirect(self.registration.scope+'?shared=1',303);
    })());
    return;
  }
  if(e.request.method==='GET'&&u.origin===location.origin){
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request,{ignoreSearch:true})));
  }
});
