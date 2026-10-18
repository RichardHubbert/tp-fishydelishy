/**
 * Site Configuration
 * 
 * This file contains all client-specific configuration for the Table Pilot app.
 * To duplicate this site for a new client:
 * 1. Update the values in this file
 * 2. Replace assets in /public/brand/ folder
 * 3. Update environment variables (see .env.example)
 * 4. Update Supabase configuration
 */

export const siteConfig = {
  // ============================================
  // BUSINESS INFORMATION
  // ============================================
  business: {
    name: "Amici Coffee",
    // Short name/acronym shown in logo badge (e.g., "TP" for Table Pilot)
    logoText: "TP",
    // Optional: tagline or description
    tagline: "Restaurant Table Bookings",
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
      heroImage: "/brand/hero.jpg",         // Optional: default hero image (currently using amicicoffee.jpg)
      ogImage: "/brand/og-image.png",       // Optional: Open Graph/social share image
    },
  },

  // ============================================
  // CONTACT & LOCATION
  // ============================================
  contact: {
    phone: "+44 20 7946 0958",  // Optional: Default phone (can be overridden per-restaurant in database)
    email: "info@amicicoffee.com",  // Optional: Default email (can be overridden per-restaurant in database)
    address: "123 Fine Dining Street, London, UK",  // Optional: Default address
  },

  // ============================================
  // OPERATING HOURS
  // ============================================
  hours: {
    display: "Daily: 11:00 AM - 10:00 PM",
    lastBooking: "7:30 PM",
    // Optional: Add structured hours for future use
    // schedule: {
    //   monday: { open: "11:00", close: "22:00" },
    //   tuesday: { open: "11:00", close: "22:00" },
    //   ...
    // }
  },

  // ============================================
  // SEO & META TAGS
  // ============================================
  seo: {
    title: "Amici Coffee - Restaurant Table Bookings",
    description: "Book your table with Amici Coffee. Experience seamless restaurant bookings with our intuitive booking system.",
    keywords: "restaurant, booking, table reservation, dining, italian coffee, amici coffee",
    author: "Amici Coffee",
    
    // Open Graph (Facebook, LinkedIn, etc.)
    og: {
      type: "website",
      image: "https://lovable.dev/opengraph-image-p98pqg.png",
    },
    
    // Twitter
    twitter: {
      card: "summary_large_image",
      site: "@tablepilot",  // Twitter handle
    },
  },

  // ============================================
  // URLS & ROUTING
  // ============================================
  urls: {
    // Production domain (without protocol)
    domain: "amicicoffee.tablepilot.co.uk",
    // Base path for the app (e.g., "/amicicoffee" or "/" for root)
    basePath: "/amicicoffee",
    // Full production URL
    productionUrl: "https://tablepilot.co.uk/amicicoffee/",
  },

  // ============================================
  // FEATURES & COPY
  // ============================================
  features: {
    // Hero section copy
    hero: {
      welcome: "Welcome to",  // "Welcome to {business.name}"
      subtitle: "Experience the perfect blend of Italian tradition and modern comfort. Book your table today and enjoy our authentic coffee and cuisine.",
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
    fromName: "Amici Coffee",
    defaultFromEmail: "onboarding@resend.dev",  // Fallback only
  },

  // ============================================
  // DATABASE IDS (Client-specific)
  // ============================================
  ids: {
    // Default business ID for Amici Coffee
    businessId: "24e2799f-60d5-4e3b-bb30-b8049c9ae56d",
    // Default restaurant ID (if applicable)
    restaurantId: "24e2799f-60d5-4e3b-bb30-b8049c9ae56d",
    // Business slug
    slug: "amicicoffee",
  },

  // ============================================
  // ELEVENLABS INTEGRATION
  // ============================================
  integrations: {
    elevenlabs: {
      agentId: "hFhNyzsEj0QwywLVdOEQ",
      enabled: true,
    },
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
