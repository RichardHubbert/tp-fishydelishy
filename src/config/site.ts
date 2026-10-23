/**
 * Site configuration shared by every copy.
 * The restaurant name, id, and public path come from `.env`, which
 * `npm run new-restaurant` writes and which is not committed.
 */

const configuredName = (import.meta.env.VITE_RESTAURANT_NAME || '').trim();
const restaurantName = configuredName || 'Your Restaurant';
const logoText = configuredName
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 3)
  .map((part) => part[0]?.toUpperCase() || '')
  .join('') || 'YR';

const rawBase = (import.meta.env.VITE_BASE_PATH || '/').trim();
const basePath = rawBase === '' || rawBase === '/'
  ? '/'
  : `/${rawBase.replace(/^\/+|\/+$/g, '')}`;
const productionUrl = basePath === '/'
  ? 'https://tablepilot.co.uk/'
  : `https://tablepilot.co.uk${basePath}/`;

export const siteConfig = {
  // ============================================
  // BUSINESS INFORMATION
  // ============================================
  business: {
    name: restaurantName,
    // Short name/acronym shown in logo badge
    logoText,
    // Optional: tagline or description
    tagline: "Restaurant Table Bookings",
    // Leave blank in this repo. npm run new-restaurant writes a fresh id into .env.
    restaurantId: "",
    // This site's row in the shared businesses table. Leave blank to use the restaurant's business.
    businessId: "",
  },

  // ============================================
  // BRANDING & THEME
  // ============================================
  branding: {
    // Primary brand colors (Tailwind color names)
    // Used for buttons, highlights, and accents throughout the app
    colors: {
      primary: "amber",      // Main brand color (e.g., amber, blue, green)
      primaryShade: "600",   // Default shade (400-900)
      hover: "700",          // Hover state shade
      light: "300",          // Light accent shade
      lighter: "500",        // Badge/icon shade
      background: "orange",  // Hero background gradient color
      backgroundShade: "100",
    },
    
    // Asset paths (relative to /public)
    assets: {
      favicon: "/brand/favicon.ico",
      logo: "/brand/logo.png",              // Optional: full logo image
      heroImage: "/brand/hero.jpg",         // Optional: default hero image
      ogImage: "/brand/og-image.png",       // Optional: Open Graph/social share image
    },
  },

  // ============================================
  // CONTACT & LOCATION
  // ============================================
  contact: {
    phone: "",  // TODO: Add your phone number (can be overridden per-restaurant in database)
    email: "hello@example.com",  // TODO: Add your email (can be overridden per-restaurant in database)
    address: "",  // TODO: Add your address (can be overridden per-restaurant in database)
  },

  // ============================================
  // OPERATING HOURS
  // ============================================
  hours: {
    display: "Daily: 11:00 AM - 10:00 PM",
    lastBooking: "7:30 PM",
    opening: "11:00",
    closing: "22:00",
    lastBookingTime: "19:30",
    slotInterval: 30,
  },

  restaurant: {
    defaultId: "",
  },

  // ============================================
  // SEO & META TAGS
  // ============================================
  seo: {
    title: restaurantName,
    description: `Book a table at ${restaurantName}. Choose your date, time, and party size.`,
    keywords: "restaurant, booking, table reservation, dining",
    author: restaurantName,
    
    // Open Graph (Facebook, LinkedIn, etc.)
    og: {
      type: "website",
      image: "/brand/og-image.png", // TODO: Add your social share image to public/brand/
    },
    
    // Twitter
    twitter: {
      card: "summary_large_image",
      site: "@yourhandle",  // TODO: Update with your Twitter/X handle
    },
  },

  // ============================================
  // URLS & ROUTING
  // ============================================
  urls: {
    // Production domain (without protocol)
    domain: "tablepilot.co.uk",
    // Base path for the app. npm run new-restaurant sets this from the restaurant name.
    basePath,
    // Full production URL
    productionUrl,
  },

  // ============================================
  // FEATURES & COPY
  // ============================================
  features: {
    // Hero section copy
    hero: {
      welcome: "Welcome to",  // "Welcome to {business.name}"
      subtitle: "Choose your date, time, and party size.",
      ctaText: "Book a Table",
    },
    
    // Feature cards displayed on home page
    cards: [
      {
        icon: "Calendar",
        title: "Easy Booking",
        description: "Book your table in seconds",
      },
      {
        icon: "Users",
        title: "Group Friendly",
        description: "Perfect for any party size",
      },
      {
        icon: "Clock",
        title: "Flexible Times",
        description: "Choose your preferred time",
      },
      {
        icon: "Star",
        title: "Premium Service",
        description: "Exceptional dining experience",
      },
    ],
    
    // Restaurant info section
    info: {
      heading: "Visit {name}",  // {name} will be replaced with business name
      bookingNote: "Booking slots available every 30 minutes",
    },
  },

  // ============================================
  // EMAIL CONFIGURATION
  // ============================================
  email: {
    // Default "from" name for booking confirmations
    // Actual email address is set in Supabase secrets (RESEND_FROM)
    fromName: restaurantName,
    defaultFromEmail: "onboarding@resend.dev",  // Fallback only (use your verified domain in production)
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get Tailwind class for primary color
 */
export function getPrimaryColorClass(type: 'bg' | 'text' | 'border' = 'bg', shade?: string): string {
  const { primary, primaryShade } = siteConfig.branding.colors;
  const actualShade = shade || primaryShade;
  return `${type}-${primary}-${actualShade}`;
}

/**
 * Get Tailwind class for hover state
 */
export function getHoverColorClass(type: 'bg' | 'text' | 'border' = 'bg'): string {
  const { primary, hover } = siteConfig.branding.colors;
  return `hover:${type}-${primary}-${hover}`;
}

/**
 * Replace placeholders in text (e.g., "{name}" with business name)
 */
export function replaceTokens(text: string, tokens: Record<string, string> = {}): string {
  let result = text;
  const defaultTokens = {
    name: siteConfig.business.name,
    ...tokens,
  };
  
  Object.entries(defaultTokens).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  
  return result;
}
