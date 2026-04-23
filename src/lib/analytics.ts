import ReactGA from "react-ga4";

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

// Specific events for the app
export const trackOrderStart = (itemName: string, type: string) => {
  trackEvent("Ecommerce", "Order Start", `${type}: ${itemName}`);
};

export const trackOrderComplete = (itemName: string, amount: number) => {
  trackEvent("Ecommerce", "Order Complete", itemName, amount);
};

export const trackConsultation = (illness: string) => {
  trackEvent("Engagement", "Consultation Submitted", illness);
};

export const trackWhatsAppClick = (location: string) => {
  trackEvent("Engagement", "WhatsApp Click", location);
};

export const trackBlogView = (title: string) => {
  trackEvent("Content", "Blog View", title);
};
