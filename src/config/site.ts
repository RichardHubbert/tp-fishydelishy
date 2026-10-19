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
    name: "Fishy Delishy",
    // Short name/acronym shown in logo badge
    logoText: "FD",
    // Optional: tagline or description
    tagline: "The Best Fish and Chips",
  },

  // ============================================
  // BRANDING & THEME
  // ============================================
  branding: {
    // Primary brand colors (Tailwind color names)
    // Used for buttons, highlights, and accents throughout the app
    colors: {
      primary: "blue",      // Main brand color
      primaryShade: "600",   // Default shade (400-900)
      hover: "700",          // Hover state shade
      light: "300",          // Light accent shade
      lighter: "500",        // Badge/icon shade
      background: "blue",  // Hero background gradient color
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
    phone: "07973 226393",
    email: "richardhubbert@gmail.com",
    address: "15 Sand Lane, Northill",
  },

  // ============================================
  // OPERATING HOURS
  // ============================================
  hours: {
    // TODO: Confirm actual Fishy Delishy hours
    display: "Daily: 9:00 AM - 11:00 PM",
    lastBooking: "10:00 PM",  // TODO: Confirm last booking time
    // Optional: Add structured hours for future use
    // schedule: {
    //   monday: { open: "09:00", close: "23:00" },
    //   tuesday: { open: "09:00", close: "23:00" },
    //   ...
    // }
  },

  // ============================================
  // SEO & META TAGS
  // ============================================
  seo: {
    title: "Fishy Delishy - Fish and Chips Table Bookings in Northill",
    description: "Book your table at Fishy Delishy in Northill. The best fish and chips with easy online table reservations.",
    keywords: "fish and chips, restaurant, booking, table reservation, northill, fishy delishy",
    author: "Fishy Delishy",
    
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
    domain: "tablepilot.co.uk",
    // Base path for the app
    basePath: "/fishydelishy",
    // Full production URL
    productionUrl: "https://tablepilot.co.uk/fishydelishy/",
  },

  // ============================================
  // FEATURES & COPY
  // ============================================
  features: {
    // Hero section copy
    hero: {
      welcome: "Welcome to",  // "Welcome to {business.name}"
      subtitle: "Experience the finest fish and chips in Northill. Book your table today and enjoy our traditional recipes and fresh, locally-sourced ingredients.",
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
    fromName: "Fishy Delishy",
    defaultFromEmail: "bookings@tablepilot.co.uk",  // Fallback only
  },

  // ============================================
  // DATABASE IDS (Client-specific)
  // ============================================
  ids: {
    // TODO: Set these to Fishy Delishy's actual restaurant UUID after setup
    // Shared bookings table. This site's rows are the ones with these ids.
    businessId: "",
    restaurantId: "",
    slug: "fishydelishy",
  },

  // ============================================
  // INTEGRATIONS (Client-specific)
  // ============================================
  integrations: {
    elevenlabs: {
      // TODO: Replace with Fishy Delishy's ElevenLabs agent ID
      // Currently using Amici Coffee's agent ID - needs updating
      agentId: "hFhNyzsEj0QwywLVdOEQ",
      enabled: false,  // Disabled until Fishy Delishy agent is set up
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
