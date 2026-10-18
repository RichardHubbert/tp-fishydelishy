# Amici Coffee - Differences from Core

This document outlines what differs between this Amici Coffee client site and the tp-woodman core repository.

## 📋 Migration Summary

This site has been migrated to use the config-driven architecture from [tp-woodman](https://github.com/RichardHubbert/tp-woodman). All Amici Coffee-specific values are now centralized in `src/config/site.ts`.

## ✅ What Was Migrated

### Core Configuration Structure
- ✅ Created `src/config/site.ts` with all Amici Coffee business values
- ✅ Created `public/brand/` directory with brand assets
  - `favicon.ico` (from existing `public/favicon.ico`)
  - `hero.jpg` (from existing `public/amicicoffee.jpg`)
- ✅ Created `.env.example` for environment variable documentation
- ✅ Copied `CLONING.md` from core (cloning guide)
- ✅ Copied `scripts/setup-new-client.js` from core

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
  - `index.html` - simplified, SEO now injected from config
  - `main.tsx` - dynamically sets meta tags from config
- ✅ Updated `README.md` to reference config-driven architecture

## 🔧 Client-Specific Configuration

All Amici Coffee-specific values are in `src/config/site.ts`:

```typescript
{
  business: {
    name: "Amici Coffee",
    logoText: "TP",
    tagline: "Restaurant Table Bookings"
  },
  branding: {
    colors: {
      primary: "amber",
      primaryShade: "600",
      hover: "700",
      background: "orange",
      backgroundShade: "100"
    }
  },
  contact: {
    phone: "+44 20 7946 0958",
    email: "info@amicicoffee.com",
    address: "123 Fine Dining Street, London, UK"
  },
  urls: {
    domain: "amicicoffee.tablepilot.co.uk",
    basePath: "/amicicoffee",
    productionUrl: "https://tablepilot.co.uk/amicicoffee/"
  },
  ids: {
    businessId: "24e2799f-60d5-4e3b-bb30-b8049c9ae56d",
    restaurantId: "24e2799f-60d5-4e3b-bb30-b8049c9ae56d",
    slug: "amicicoffee"
  },
  integrations: {
    elevenlabs: {
      agentId: "hFhNyzsEj0QwywLVdOEQ",
      enabled: true
    }
  }
}
```

## 🎨 Client-Specific Features

These features exist in Amici Coffee but are NOT in the core (yet):

1. **ElevenLabs AI Voice Assistant**
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
   - `public/amicicoffee.jpg` - Original hero image (now also at `public/brand/hero.jpg`)

## 🔄 Future Core Updates

When updating from the core tp-woodman repository:

### ✅ Safe to Merge (Shared Code)
These should match the core and can be updated:
- All UI components in `src/components/ui/`
- Shared layout components (when they use `siteConfig`)
- Core booking flow components
- Type definitions in `src/integrations/supabase/types.ts`
- Build configuration (`tailwind.config.ts`, `tsconfig.json`, etc.)

### ⚠️ Merge Carefully (Client-Customized)
These may have Amici-specific logic:
- `src/config/site.ts` - **NEVER merge**, client-specific
- `public/brand/*` - **NEVER merge**, client-specific assets
- CRM-related files - client-specific feature
- Multi-business database logic - may differ from core

### 📝 Files to Add from Core (In-Progress PR)
The core is adding these files in a PR - add them when ready:
- `.gitattributes` - Merge strategy for `site.ts` and `public/brand/**`
- `scripts/link-to-core.sh` - Script to add core as git remote
- `scripts/update-from-core.sh` - Script to pull updates from core
- `UPDATING.md` - Guide for updating from core

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
className={primary === 'amber' ? 'text-amber-600' : 'text-blue-600'}

// Or use cn() helper:
className={cn(
  'text-600',
  primary === 'amber' && 'text-amber-600',
  primary === 'blue' && 'text-blue-600'
)}
```

## 📦 Build Status

✅ Build passes (`npm run build`)
- No TypeScript errors
- No missing imports
- Successfully generates production bundle

## 📚 Documentation

- ✅ `README.md` - Updated with config-driven info
- ✅ `CLONING.md` - Guide for duplicating this site
- ✅ `.env.example` - Environment variable template
- ✅ `CHANGES_FROM_CORE.md` - This file
- 📋 `CRM_INTEGRATION_SETUP.md` - CRM webhook setup (client-specific)
- 📋 `NEW_CUSTOMER_CRM_INTEGRATION.md` - Customer CRM docs (client-specific)

## 🚀 Next Steps

To fully align with the core update workflow:

1. **Add .gitattributes** (when available from core PR):
   ```
   src/config/site.ts merge=ours
   public/brand/** merge=ours
   ```

2. **Link to Core Repository**:
   ```bash
   git remote add core https://github.com/RichardHubbert/tp-woodman.git
   git fetch core
   ```

3. **Set Up Update Workflow**:
   - Copy `scripts/update-from-core.sh` from core (when available)
   - Document update process in `UPDATING.md`

4. **Fix Dynamic Tailwind Classes** (if styling breaks):
   - Review all components using template literal classes
   - Replace with conditional or safelist approach

## ✨ Summary

This site is now fully config-driven and ready to receive updates from the core tp-woodman repository. All Amici Coffee-specific values are in one place (`src/config/site.ts`), making it easy to:

- Clone this for new clients
- Update shared features from core
- Maintain client-specific customizations
- Keep branding and business logic separate
