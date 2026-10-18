<<<<<<< HEAD
# Fishy Delishy - Table Pilot
=======
# Table Pilot Pro - Configurable Restaurant Booking System
>>>>>>> woodman/main

A modern, easily cloneable restaurant table booking application built with React, TypeScript, Supabase, and Tailwind CSS.

## 🌟 Key Features

<<<<<<< HEAD
**Production URL**: https://tablepilot.co.uk/fishydelishy/

**Project Name**: Fishy Delishy

## Config-Driven Architecture

This project has been migrated to use the config-driven layout from [tp-core](https://github.com/RichardHubbert/tp-core). All client-specific values are centralized in `src/config/site.ts`.

### Key Configuration

- **Business Config**: `src/config/site.ts` - Single source of truth for business name, branding, contact info, SEO, etc.
- **Brand Assets**: `public/brand/` - All brand-specific assets (favicon, logo, hero image, og-image)
- **Environment**: `.env` (gitignored) and `.env.example` - Supabase and service credentials

To customize this site for a different client, see [CLONING.md](./CLONING.md).
=======
- **One-Config Duplication**: Clone for new clients by editing a single config file
- **Restaurant Selection**: Comprehensive dropdown with search and visual display
- **User Authentication**: Secure sign-in with Supabase Auth
- **Booking System**: Real-time table reservations with email confirmations
- **Admin Dashboard**: Manage bookings, restaurants, and users
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Email Notifications**: Automated booking confirmations via Resend

## 🚀 Quick Start for New Clients
>>>>>>> woodman/main

**Want to duplicate this app for a new restaurant?** See **[CLONING.md](./CLONING.md)** for the complete step-by-step guide.

### Quick Setup Summary

1. Use this repo as a template or clone it
2. Edit `src/config/site.ts` with your client's information
3. Replace brand assets in `public/brand/`
4. Set up Supabase and update `.env`
5. Deploy!

Optional: Run `npm run new-client` for an interactive setup wizard.

## 🎨 What's Configurable?

Everything client-specific is now in **one file**: `src/config/site.ts`

- ✅ Business name and branding
- ✅ Logo text and colors
- ✅ Contact information (phone, email, address)
- ✅ Opening hours
- ✅ SEO meta tags (title, description, Open Graph, Twitter)
- ✅ Domain and URL structure
- ✅ Feature copy and messaging
- ✅ Email sender configuration

**Current site**: Woodman and Olive

## 📁 Project Structure

```
tp-woodman/
├── src/
│   ├── config/
│   │   └── site.ts           ← 🎯 Edit this file for new clients!
│   ├── components/           ← React components
│   ├── pages/                ← Main pages
│   ├── services/             ← API services
│   └── integrations/         ← Supabase integration
├── public/
│   └── brand/                ← 🎯 Replace assets here!
│       ├── favicon.ico
│       ├── logo.png
│       ├── hero.jpg
│       └── og-image.png
├── supabase/                 ← Database migrations and functions
├── .env.example              ← Environment variables template
├── CLONING.md                ← 📖 Full cloning guide
└── package.json
```

## 💻 Development

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Resend account (for emails)

### Local Setup

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:8080](http://localhost:8080)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run new-client` - Interactive setup wizard for new clients
- `npm run update-from-core` - Pull updates from upstream core (for client repos)

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Email**: Resend API
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query)

### Database

This app uses Supabase with the following main tables:

- `businesses` - Multi-tenant business/restaurant information
- `restaurants` - Restaurant details and settings
- `bookings` - Customer reservations
- `customers` - Customer information (CRM)
- User authentication managed by Supabase Auth

Run migrations:
```bash
supabase db push
```

## 📋 Features Detail

### Restaurant Selection
The application includes a comprehensive restaurant selector with:
- **Dropdown Menu**: Easy selection from available restaurants
- **Search Functionality**: Filter by name, cuisine, or address
- **Visual Display**: Restaurant images, ratings, and details
- **Responsive Design**: Works on all device sizes
- **Global State**: Selected restaurant available throughout the app

### Restaurant Management (Admin Only)
Admin users (richardhubbert@gmail.com) can manage restaurants through:
- **Add New Restaurants**: Complete form with all restaurant details
- **Edit Existing Restaurants**: Update any restaurant information
- **Delete/Restore Restaurants**: Soft delete with ability to restore
- **Search & Filter**: Find restaurants quickly in the admin interface
- **Database Integration**: All changes saved to Supabase
- **Access Control**: Only admin users can access management features

### Booking System
- User authentication and authorization
- Table reservation with date, time, and party size selection
- Real-time availability checking
- Automated email confirmations via Resend
- Admin dashboard for managing bookings
- Customer CRM integration

## 🚢 Deployment

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Deploy to Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

See [CLONING.md](./CLONING.md) for detailed deployment instructions.

## 🔑 Environment Variables

Required environment variables (see `.env.example`):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Supabase Edge Function secrets (set via Supabase CLI):
```bash
supabase secrets set RESEND_API_KEY=your_resend_key
supabase secrets set RESEND_FROM="Your Restaurant <email@domain.com>"
```

## 🎯 Multi-Client Management

This codebase is designed to be easily duplicated for multiple restaurant clients. Each client gets:

- Their own repository (forked or templated from this one)
- Their own `src/config/site.ts` configuration
- Their own brand assets in `public/brand/`
- Their own Supabase project
- Their own deployment

**Example sites using this template:**
- tp-woodman (Woodman and Olive)
- tp-amicicoffee (Amici Coffee)
- tp-fishydelishy (Fishy Delishy)

### 🔄 Upstream Core Architecture

This repository serves as the **upstream core** for all client sites. New features and bug fixes can be pushed to all clients while preserving their specific configurations.

**Key files for multi-client workflow:**
- `src/config/site.ts` - Client configuration (protected from merges)
- `public/brand/` - Brand assets (protected from merges)
- `.gitattributes` - Merge protection rules
- `scripts/link-to-core.sh` - Connect a client repo to this core (one-time)
- `scripts/update-from-core.sh` - Pull updates from core to client (recurring)

**For client setup:** See [CLONING.md](./CLONING.md)  
**For rolling out updates:** See [UPDATING.md](./UPDATING.md)

## 📝 Making Changes

### Adding a New Feature
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Test locally: `npm run dev`
4. Build: `npm run build`
5. Commit and push
6. Create pull request

### Customizing for a Client

**Simple changes** (most common):
- Edit `src/config/site.ts`
- Replace assets in `public/brand/`

**Advanced changes** (layout, new sections):
- Components are in `src/components/`
- Pages are in `src/pages/`
- Use Tailwind utility classes for styling

## 🐛 Troubleshooting

### Build Issues
- Ensure Node.js 18+ is installed
- Clear node_modules: `rm -rf node_modules && npm install`
- Check `src/config/site.ts` for syntax errors

### Supabase Connection
- Verify `.env` has correct credentials
- Check Supabase project is not paused (free tier pauses after inactivity)
- Ensure migrations are applied: `supabase db push`

### Email Not Sending
- Verify Resend API key is set in Supabase secrets
- Check Supabase Edge Function logs
- Confirm FROM email is verified in Resend

## 📚 Documentation

- [CLONING.md](./CLONING.md) - Complete guide for duplicating this site
- [UPDATING.md](./UPDATING.md) - Guide for rolling out updates to client sites
- [.env.example](./.env.example) - Environment variables reference
- [CRM_INTEGRATION_SETUP.md](./CRM_INTEGRATION_SETUP.md) - CRM integration guide

## 🤝 Contributing

This is a client project template. If you're working on the base template:

1. Make changes that benefit all clients
2. Test thoroughly
3. Update CLONING.md if setup process changes
4. Document breaking changes

## 📄 License

Private repository - All rights reserved

## 🔗 Links

- **Supabase**: https://supabase.com
- **Resend**: https://resend.com
- **Tailwind CSS**: https://tailwindcss.com
- **shadcn/ui**: https://ui.shadcn.com

---

**Current Configuration**: Woodman and Olive  
**Last Updated**: October 2026
