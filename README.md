# Fishy Delishy - Table Pilot

## Project info

**Development URL**: https://lovable.dev/projects/572fb16c-338f-484d-a597-4d5dc1a7a5cc

**Production URL**: https://tablepilot.co.uk/fishydelishy/

**Project Name**: Fishy Delishy

## Config-Driven Architecture

This project has been migrated to use the config-driven layout from [tp-woodman](https://github.com/RichardHubbert/tp-woodman). All client-specific values are centralized in `src/config/site.ts`.

### Key Configuration

- **Business Config**: `src/config/site.ts` - Single source of truth for business name, branding, contact info, SEO, etc.
- **Brand Assets**: `public/brand/` - All brand-specific assets (favicon, logo, hero image, og-image)
- **Environment**: `.env` (gitignored) and `.env.example` - Supabase and service credentials

To customize this site for a different client, see [CLONING.md](./CLONING.md).

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/572fb16c-338f-484d-a597-4d5dc1a7a5cc) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Features

### Restaurant Selection
The application includes a comprehensive restaurant selector with:
- **Dropdown Menu**: Easy selection from a list of available restaurants
- **Search Functionality**: Filter restaurants by name, cuisine, or address
- **Visual Display**: Each restaurant shows an image, rating, and details
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **Global State Management**: Selected restaurant is available throughout the app

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
- Email confirmation system
- Admin dashboard for managing bookings

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Backend)
- React Router (Navigation)
- React Query (Data fetching)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/572fb16c-338f-484d-a597-4d5dc1a7a5cc) and click on Share -> Publish.

The production site will be available at: https://tablepilot.co.uk

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
