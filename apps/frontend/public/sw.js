const CACHE_NAME = "trustai-v1"
const ASSET_CACHE = "trustai-assets-v1"
const API_CACHE = "trustai-api-v1"

// Only cache manifest, not index.html or root
const urlsToCache = [
  "/manifest.json",
]

// Install event - cache assets
self.addEventListener("install", (event) => {
  console.log("📦 Service Worker installing...")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Opening cache:", CACHE_NAME)
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log("✅ Service Worker installed and cache populated")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("❌ Cache failed:", error)
      })
  )
})

// Activate event - clean up old caches and take control
self.addEventListener("activate", (event) => {
  console.log("♻️ Service Worker activating...")
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== ASSET_CACHE && cacheName !== API_CACHE)
          .map((cacheName) => {
            console.log(`🗑️ Deleting old cache: ${cacheName}`)
            return caches.delete(cacheName)
          })
      )
    }).then(() => {
      console.log("✅ Service Worker activated and ready")
      return self.clients.claim()
    })
  )
})

// Fetch event - implement caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // ALWAYS fetch HTML fresh, never use cache
  if (request.destination === "document" || url.pathname.endsWith(".html") || url.pathname === "/") {
    console.log(`📄 HTML request (always fresh): ${url.pathname}`)
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          if (!response || response.status !== 200) {
            console.warn(`⚠️ HTML fetch failed with status ${response.status}`)
            return response
          }
          // Never cache HTML - always return fresh from network
          console.log(`✅ HTML loaded fresh: ${url.pathname}`)
          return response
        })
        .catch((error) => {
          console.error(`❌ HTML fetch error: ${error.message}`)
          // On error, try to return any cached version as fallback
          return caches.match("/index.html")
            .then(response => response || new Response("Offline - please check your connection", { status: 503 }))
        })
    )
    return
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith("/api/")) {
    console.log(`🔌 API request: ${url.pathname}`)
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          // Cache successful API responses
          if (response && response.ok) {
            const cache = caches.open(API_CACHE)
            cache.then((c) => {
              console.log(`💾 Caching API response: ${url.pathname}`)
              c.put(request, response.clone())
            })
          }
          return response
        })
        .catch((error) => {
          console.error(`❌ API fetch error: ${error.message}, trying cache...`)
          // Return cached API response if offline
          return caches
            .match(request)
            .then((response) => {
              if (response) {
                console.log(`📦 Using cached API: ${url.pathname}`)
                return response
              }
              return new Response(
                JSON.stringify({ offline: true, message: "Offline - cached data unavailable" }),
                { status: 503, headers: { "Content-Type": "application/json" } }
              )
            })
        })
    )
    return
  }

  // Handle static assets with cache-first strategy
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/) ||
    request.destination === "style" ||
    request.destination === "script"
  ) {
    console.log(`📦 Static asset request: ${url.pathname}`)
    event.respondWith(
      caches
        .match(request)
        .then((response) => {
          if (response) {
            console.log(`✅ Asset from cache: ${url.pathname}`)
            return response
          }

          console.log(`📥 Fetching asset: ${url.pathname}`)
          return fetch(request, { cache: 'default' }).then((response) => {
            if (!response || response.status !== 200 || response.type === "error") {
              console.warn(`⚠️ Asset fetch failed: ${url.pathname}`)
              return response
            }

            const responseToCache = response.clone()
            caches.open(ASSET_CACHE).then((cache) => {
              console.log(`💾 Caching asset: ${url.pathname}`)
              cache.put(request, responseToCache)
            })

            return response
          })
        })
        .catch((error) => {
          console.error(`❌ Asset error: ${url.pathname} - ${error.message}`)
          // Return offline placeholder
          return new Response("Asset unavailable offline", { status: 503 })
        })
    )
    return
  }

  // Default strategy: network first, fallback to cache
  console.log(`🌐 Default request: ${url.pathname}`)
  event.respondWith(
    fetch(request, { cache: 'no-store' })
      .then((response) => {
        if (!response || response.status !== 200) {
          console.warn(`⚠️ Default fetch failed: ${url.pathname}`)
          return response
        }

        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          console.log(`💾 Caching response: ${url.pathname}`)
          cache.put(request, responseToCache)
        })

        return response
      })
      .catch((error) => {
        console.error(`❌ Default fetch error: ${url.pathname} - ${error.message}`)
        return (
          caches.match(request) ||
          caches.match("/index.html").then((response) =>
            response || new Response("Offline - please check your connection", { status: 503 })
          )
        )
      })
  )
})

// Background sync
self.addEventListener("sync", (event) => {
  console.log(`🔄 Background sync event: ${event.tag}`)
  if (event.tag === "sync-offline-queue") {
    event.waitUntil(
      (async () => {
        try {
          // Notify clients to sync their offline queue
          const clients = await self.clients.matchAll()
          clients.forEach((client) => {
            client.postMessage({
              type: "SYNC_OFFLINE_QUEUE",
              timestamp: Date.now(),
            })
          })
          console.log("✅ Background sync triggered")
        } catch (error) {
          console.error("❌ Background sync failed:", error)
          throw error
        }
      })()
    )
  }
})

// Message handler - handle messages from clients
self.addEventListener("message", (event) => {
  console.log(`📨 Message from client:`, event.data)
  
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("⏩ Skipping waiting and activating new worker")
    self.skipWaiting()
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    console.log("🗑️ Clearing all caches...")
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName).then(() => {
            console.log(`✅ Deleted cache: ${cacheName}`)
          })
        })
      )
    })
  }
})

// Push notification handler
self.addEventListener("push", (event) => {
  console.log("📲 Push notification received")
  if (!event.data) {
    console.log("⚠️ Push notification received but no data")
    return
  }

  const data = event.data.json()
  const options = {
    body: data.body || "TrustAI notification",
    icon: "/logo-192x192.png",
    badge: "/logo-96x96.png",
    tag: data.tag || "trustai-notification",
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || "/",
    },
  }

  event.waitUntil(self.registration.showNotification(data.title || "TrustAI", options))
})

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("🔔 Notification clicked")
  event.notification.close()

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === "/" && "focus" in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data.url || "/")
      }
    })
  )
})

console.log("🚀 TrustAI Service Worker ready")
