'use strict';
const CACHE='ocd-shell-v2-20261023';
const SHELL=['./','./index.html','./styles.css','./app.js','./manifest.json','./icon.png','./logo.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('ocd-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(event.request);if(response.ok && SHELL.some(path=>new URL(path,self.registration.scope).href===event.request.url))await cache.put(event.request,response.clone());return response}catch{const cached=await cache.match(event.request);if(cached)return cached;if(event.request.mode==='navigate')return await cache.match('./index.html');return Response.error()}})())});
function notification(data){return self.registration.showNotification(data.title||'OCD reminder',{body:data.body||'Your reminder is ready.',icon:'icon.png',tag:data.tag||'ocd-reminder'})}
self.addEventListener('message',event=>{if(event.data?.type==='SHOW_NOTIFICATION')event.waitUntil(notification(event.data))});
self.addEventListener('push',event=>{let data={};try{data=event.data?.json()||{}}catch{data={body:event.data?.text()}}event.waitUntil(notification(data))});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});const existing=windows.find(client=>client.url.startsWith(self.registration.scope));if(existing)return existing.focus();return self.clients.openWindow(self.registration.scope)})())});
