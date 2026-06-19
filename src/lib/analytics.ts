import ReactGA from "react-ga4";
import { trackMetaPageView, trackMetaPixelEvent } from "./metaPixel";

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initGA = () => {
  if (MEASUREMENT_ID) {
    ReactGA.initialize(MEASUREMENT_ID);
    console.log("GA Initialized with ID:", MEASUREMENT_ID);
  } else {
    console.warn("GA Measurement ID not found. Analytics disabled.");
  }
};

export const trackPageView = (path: string, title?: string) => {
  if (MEASUREMENT_ID) {
    ReactGA.send({ hitType: "pageview", page: path, title: title || path });
  }
  trackMetaPageView(path, title);
};

export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  if (MEASUREMENT_ID) {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
  }
};

// Specific events for the app (Mapped to standard Meta Pixel and Google Analytics tracking schema)
export const trackOrderStart = (itemName: string, type: string) => {
  trackEvent("Ecommerce", "Order Start", `${type}: ${itemName}`);
  trackMetaPixelEvent("InitiateCheckout", { 
    content_name: itemName, 
    content_category: type 
  });
};

export const trackOrderComplete = (itemName: string, amount: number) => {
  trackEvent("Ecommerce", "Order Complete", itemName, amount);
  trackMetaPixelEvent("Purchase", { 
    content_name: itemName, 
    value: amount, 
    currency: "USD" 
  });
};

export const trackConsultation = (illness: string) => {
  trackEvent("Engagement", "Consultation Submitted", illness);
  trackMetaPixelEvent("Lead", { 
    content_category: "Consultation", 
    content_name: illness 
  });
};

export const trackWhatsAppClick = (location: string) => {
  trackEvent("Engagement", "WhatsApp Click", location);
  trackMetaPixelEvent("Contact", { 
    content_category: "WhatsApp", 
    content_name: location 
  });
};

export const trackBlogView = (title: string) => {
  trackEvent("Content", "Blog View", title);
  trackMetaPixelEvent("ViewContent", { 
    content_category: "Blog", 
    content_name: title 
  });
};
