const isDevOrPreview = () => {
  if (typeof window === "undefined") return true;
  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.includes("run.app") ||
    hostname.includes(".local")
  );
};

export const initMetaPixel = () => {
  if (typeof window === "undefined") return;

  const pixelId = import.meta.env.VITE_META_PIXEL_ID || "1552654879770370";

  // Check if we are in local dev or Cloud Run preview environment
  if (isDevOrPreview()) {
    console.log(`[Meta Pixel] Bypassed Pixel loading in development/preview environments (${window.location.hostname})`);
    return;
  }

  // Set up Facebook Pixel command queue seamlessly
  const w = window as any;
  if (!w.fbq) {
    w.fbq = function () {
      if (w.fbq.callMethod) {
        w.fbq.callMethod.apply(w.fbq, arguments);
      } else {
        w.fbq.queue.push(arguments);
      }
    };
    if (!w._fbq) w._fbq = w.fbq;
    w.fbq.push = w.fbq;
    w.fbq.loaded = true;
    w.fbq.version = "2.0";
    w.fbq.queue = [];
  }

  // Create script element asynchronously (non-blocking for ultimate site performance)
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  
  document.head.appendChild(script);

  // Initialize and track initial PageView
  w.fbq("init", pixelId);
  w.fbq("track", "PageView");
  console.log(`[Meta Pixel] Successfully initialized with ID: ${pixelId}`);
};

export const trackMetaPageView = (path: string, title?: string) => {
  if (typeof window === "undefined" || isDevOrPreview()) return;
  const w = window as any;
  if (w.fbq) {
    w.fbq("track", "PageView", { page_path: path, page_title: title });
  }
};

export const trackMetaPixelEvent = (eventName: string, params?: object) => {
  if (typeof window === "undefined" || isDevOrPreview()) return;
  const w = window as any;
  if (w.fbq) {
    w.fbq("track", eventName, params);
  }
};
