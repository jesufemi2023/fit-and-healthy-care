/**
 * Centralized configuration for the application.
 * No hardcoded strings should exist outside of this file or environment variables.
 */

const getEnv = (key: string, fallback: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

export const CONFIG = {
  company: {
    name: getEnv('VITE_COMPANY_NAME', "Fit and Healthy Care"),
    subtitle: getEnv('VITE_COMPANY_SUBTITLE', "NIGERIA LTD"),
    phone: getEnv('VITE_CONTACT_PHONE', "+234 (0) 123 456 789"),
    logoUrl: getEnv('VITE_LOGO_URL', ""),
    bankDetails: {
      bankName: getEnv('VITE_BANK_NAME', "ZENITH BANK"),
      accountNumber: getEnv('VITE_ACCOUNT_NUMBER', "1234567890"),
      accountName: getEnv('VITE_ACCOUNT_NAME', "SD GHT HEALTH CARE LTD")
    }
  },
  whatsapp: {
    number: getEnv('VITE_WHATSAPP_NUMBER', "2347060734773"),
    defaultMessage: getEnv('VITE_WHATSAPP_DEFAULT_MESSAGE', "Hello Fit and Healthy Care, I would like to make an inquiry.")
  },
  defaults: {
    distributorId: getEnv('VITE_DEFAULT_DISTRIBUTOR_ID', "SD-GHT-MEMBER-001"),
  },
  heroImages: (() => {
    const images: string[] = [];
    
    // 1. Check for the comma-separated list (Most reliable for Vercel)
    const csvImages = getEnv('VITE_HERO_IMAGES', "");
    if (csvImages) {
      return csvImages.split(',').map((s: string) => s.trim()).filter((s: string) => s !== "");
    }

    // 2. Explicitly check for numbered variables
    const img1 = getEnv('VITE_HERO_IMAGE_1', "");
    const img2 = getEnv('VITE_HERO_IMAGE_2', "");
    const img3 = getEnv('VITE_HERO_IMAGE_3', "");
    const img4 = getEnv('VITE_HERO_IMAGE_4', "");
    const img5 = getEnv('VITE_HERO_IMAGE_5', "");
    const img6 = getEnv('VITE_HERO_IMAGE_6', "");
    const img7 = getEnv('VITE_HERO_IMAGE_7', "");
    const img8 = getEnv('VITE_HERO_IMAGE_8', "");

    if (img1) images.push(img1);
    if (img2) images.push(img2);
    if (img3) images.push(img3);
    if (img4) images.push(img4);
    if (img5) images.push(img5);
    if (img6) images.push(img6);
    if (img7) images.push(img7);
    if (img8) images.push(img8);

    if (images.length > 0) return images;

    // Default placeholders
    return [
      "https://picsum.photos/seed/healthcare-supplement-1/1920/1080",
      "https://picsum.photos/seed/healthcare-supplement-2/1920/1080",
      "https://picsum.photos/seed/healthcare-supplement-3/1920/1080",
      "https://picsum.photos/seed/healthcare-supplement-4/1920/1080",
    ];
  })(),
  navigation: [
    {id: "home", label: "Home"},
    {id: "about", label: "About Us"},
    {id: "products", label: "Shop Products"},
    {id: "recommended", label: "Health Packages"},
    {id: "combo", label: "Value Bundles"},
    {id: "testimonials", label: "Testimonials"},
    {id: "blog", label: "Health Tips"},
    {id: "consultation", label: "Free Consultation"},
    {id: "history", label: "My Orders"},
    {id: "admin", label: "Admin"},
  ],
};
