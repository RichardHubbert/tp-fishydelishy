# Fishy Delishy - Differences from Core

This document outlines what differs between this Fishy Delishy client site and the tp-core repository.

## 📋 Migration Summary

This site has been migrated to use the config-driven architecture from [tp-core](https://github.com/RichardHubbert/tp-core). All Fishy Delishy-specific values are now centralized in `src/config/site.ts`.

## ✅ What Was Migrated

### Core Configuration Structure
- ✅ Created `src/config/site.ts` with all Fishy Delishy business values
- ✅ Created `public/brand/` directory with brand assets
  - `favicon.ico` (from existing `public/favicon.ico`)
  - `hero.jpg` (from existing `public/amicicoffee.jpg`, renamed)
- ✅ Created `.env.example` for environment variable documentation
- ✅ Copied `CLONING.md` from core (cloning guide)
- ✅ Copied `scripts/setup-new-client.js` from core
- ✅ Added core update tooling from tp-core:
  - `scripts/link-to-core.sh`
  - `scripts/update-from-core.sh`
  - `npm run update-from-core` script
  - `UPDATING.md`

### Code Updates
- ✅ Updated all components to use `siteConfig` instead of hardcoded values:
  - `HeroSection.tsx` - dynamic business name, colors, copy
  - `NavigationHeader.tsx` - dynamic logo text and business name
  - `MobileMenu.tsx` - dynamic business name
  - `RestaurantInfoSection.tsx` - dynamic contact info, hours
  - `AuthGuard.tsx` - dynamic branding colors
  - `BookingConfirmation.tsx` - dynamic business name
- ✅ Updated services to use config IDs:
  - `businessService.ts` - uses `siteConfig.ids.businessId` and `slug`
  - `supabaseBookingService.ts` - uses `siteConfig.ids.businessId`
  - `userService.ts` - uses `siteConfig.ids.restaurantId`
  - `emailService.ts` - uses config for contact details
- ✅ Updated routing:
  - `App.tsx` - uses `siteConfig.urls.basePath`
  - `vite.config.ts` - reads base path from config
- ✅ Updated SEO:
  - `index.html` - has static meta tags for crawlers plus dynamic injection
  - `main.tsx` - dynamically updates meta tags from config
- ✅ Updated `README.md` to reference config-driven architecture

## 🔧 Client-Specific Configuration

All Fishy Delishy-specific values are in `src/config/site.ts`:

```typescript
{
  business: {
    name: "Fishy Delishy",
    logoText: "FD",
    tagline: "The Best Fish and Chips"
  },
  branding: {
    colors: {
      primary: "sky",      // Sea/ocean blue
      primaryShade: "600",
      hover: "700",
      background: "blue",
      backgroundShade: "100"
    }
  },
  contact: {
    phone: "07973 226393",
    email: "richardhubbert@gmail.com",
    address: "15 Sand Lane, Northill"
  },
  urls: {
    domain: "tablepilot.co.uk",
    basePath: "/fishydelishy",
    productionUrl: "https://tablepilot.co.uk/fishydelishy/"
  },
  // ... other config
}
```

## ⚠️ TODO: Integration IDs Need Updating

The following IDs in `src/config/site.ts` currently point to **Amici Coffee's** data and need to be replaced with Fishy Delishy's own values:

### Database IDs (`siteConfig.ids`)
```typescript
ids: {
  // TODO: Replace with Fishy Delishy business ID once created in Supabase
  businessId: "24e2799f-60d5-4e3b-bb30-b8049c9ae56d",  // Currently Amici Coffee's ID
  
  // TODO: Replace with Fishy Delishy restaurant ID once created in Supabase
  restaurantId: "24e2799f-60d5-4e3b-bb30-b8049c9ae56d",  // Currently Amici Coffee's ID
  
  // TODO: Update slug when database is set up (may already be correct)
  slug: "fishydelishy",
}
```

### ElevenLabs Integration (`siteConfig.integrations.elevenlabs`)
```typescript
integrations: {
  elevenlabs: {
    // TODO: Replace with Fishy Delishy's ElevenLabs agent ID
    agentId: "hFhNyzsEj0QwywLVdOEQ",  // Currently Amici Coffee's agent ID
    enabled: false,  // Disabled until Fishy Delishy agent is set up
  }
}
```

### Steps to Update:
1. Create Fishy Delishy business in Supabase `businesses` table
2. Create Fishy Delishy restaurant in Supabase `restaurants` table
3. Update `businessId` and `restaurantId` in `src/config/site.ts`
4. If using ElevenLabs: create Fishy Delishy agent and update `agentId`
5. Set `elevenlabs.enabled: true` when ready

## 🎨 Client-Specific Features

These features exist in Fishy Delishy but are NOT in the core (yet):

1. **ElevenLabs AI Voice Assistant** (currently disabled, pending setup)
   - Configured in `siteConfig.integrations.elevenlabs`
   - Dynamically loaded in `main.tsx`
   - Widget styling in `index.html`

2. **CRM Integration**
   - `src/services/crmService.ts` - CRM webhook integration
   - `src/components/CRMTestButton.tsx` - Test component for CRM
   - `src/components/NewCustomerCRMTestButton.tsx` - New customer CRM test
   - CRM setup docs:
     - `CRM_INTEGRATION_SETUP.md`
     - `NEW_CUSTOMER_CRM_INTEGRATION.md`

3. **Database Features**
   - Multi-business support in Supabase schema
   - `businesses` table with tenant isolation
   - `customers` table for CRM integration
   - Supabase migrations in `supabase/migrations/`
   - SQL helper files:
     - `setup-restaurants-table.sql`
     - `diagnose-customer-crm.sql`
     - `test-customer-trigger.sql`

4. **Additional Admin Features**
   - `src/pages/RestaurantManagement.tsx` - Restaurant CRUD
   - `src/pages/UserManagement.tsx` - User management
   - `src/services/restaurantService.ts` - Restaurant operations
   - `src/services/userService.ts` - User operations

5. **Legacy Assets**
   - `public/lovable-uploads/*.png` - Uploaded restaurant images
   - `public/amicicoffee.jpg` - Original hero image (keep for reference)

## 🔄 Future Core Updates

When updating from the core tp-core repository:

### ✅ Safe to Merge (Shared Code)
These should match the core and can be updated:
- All UI components in `src/components/ui/`
- Shared layout components (when they use `siteConfig`)
- Core booking flow components
- Type definitions in `src/integrations/supabase/types.ts`
- Build configuration (`tailwind.config.ts`, `tsconfig.json`, etc.)

### ⚠️ Merge Carefully (Client-Customized)
These may have Fishy Delishy-specific logic:
- `src/config/site.ts` - **NEVER merge**, client-specific (protected by .gitattributes)
- `public/brand/*` - **NEVER merge**, client-specific assets (protected by .gitattributes)
- CRM-related files - client-specific feature
- Multi-business database logic - may differ from core

### 📝 Core Update Tooling
Now included from tp-core:
- `.gitattributes` - Merge strategy for `site.ts` and `public/brand/**`
- `scripts/link-to-core.sh` - Script to add core as git remote
- `scripts/update-from-core.sh` - Script to pull updates from core
- `npm run update-from-core` - npm script wrapper
- `UPDATING.md` - Complete guide for updating from core

## 🐛 Potential Issues

### Dynamic Tailwind Classes
Some components use template literals for Tailwind classes (e.g., `text-${primary}-${primaryShade}`). These may not work as expected because Tailwind's JIT compiler cannot detect dynamic class names at build time. 

**Solutions:**
1. Use the safelist in `tailwind.config.ts` to include all color combinations
2. Use CSS custom properties instead
3. Use conditional class names with the full string

**Example Fix Needed:**
```typescript
// Current (may not work):
className={`text-${primary}-${primaryShade}`}

// Better:
className={primary === 'sky' ? 'text-sky-600' : 'text-blue-600'}

// Or use cn() helper:
className={cn(
  'text-600',
  primary === 'sky' && 'text-sky-600',
  primary === 'blue' && 'text-blue-600'
)}
```

Since Fishy Delishy now uses `sky` (not `amber`), this may need attention if styling doesn't appear correctly.

## 📦 Build Status

✅ Build passes (`npm run build`)
- No TypeScript errors
- No missing imports
- Successfully generates production bundle

## 📚 Documentation

- ✅ `README.md` - Updated with Fishy Delishy info and config-driven architecture
- ✅ `CLONING.md` - Guide for duplicating this site
- ✅ `.env.example` - Environment variable template
- ✅ `CHANGES_FROM_CORE.md` - This file
- ✅ `UPDATING.md` - Guide for updating from core
- 📋 `CRM_INTEGRATION_SETUP.md` - CRM webhook setup (client-specific)
- 📋 `NEW_CUSTOMER_CRM_INTEGRATION.md` - Customer CRM docs (client-specific)

## 🚀 Next Steps

To fully set up Fishy Delishy:

1. **Update Integration IDs** (see TODO section above):
   - Create Fishy Delishy business and restaurant in Supabase
   - Update IDs in `src/config/site.ts`
   - Set up ElevenLabs agent if needed

2. **Link to Core Repository** (already have the tooling):
   ```bash
   npm run link-to-core
   # or manually:
   bash scripts/link-to-core.sh
   ```

3. **Test Dynamic Tailwind Classes**:
   - Check if sky/blue colors render correctly
   - Add to safelist if needed

4. **Update Brand Assets**:
   - Replace `public/brand/favicon.ico` with Fishy Delishy favicon
   - Replace `public/brand/hero.jpg` with Fishy Delishy hero image
   - Add `public/brand/logo.png` if available
   - Add `public/brand/og-image.png` for social sharing

## ✨ Summary

This site is now fully config-driven and ready to receive updates from the core tp-core repository. All Fishy Delishy-specific values are in one place (`src/config/site.ts`), making it easy to:

- Clone this for new clients
- Update shared features from core
- Maintain client-specific customizations
- Keep branding and business logic separate

**Important**: Remember to update the TODO integration IDs before deploying to production!
