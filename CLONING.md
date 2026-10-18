# 🔄 Cloning This Site for a New Client

This guide walks you through duplicating this Table Pilot app for a new restaurant or business. The process has been streamlined so you only need to edit **one config file** and swap out a few assets.

## ✅ Prerequisites

- GitHub account
- Supabase account (free tier works)
- Resend account for email notifications (free tier works)
- Node.js 18+ and npm installed (for local development)

---

## 📋 Step-by-Step Cloning Checklist

### 1️⃣ Create Your Copy

**Option A: Use GitHub Template (Recommended)**
1. Click the **"Use this template"** button at the top of this repository
2. Name your new repository (e.g., `tp-newrestaurant`)
3. Clone your new repository locally:
   ```bash
   git clone https://github.com/yourusername/tp-newrestaurant.git
   cd tp-newrestaurant
   ```

**Option B: Manual Clone**
1. Fork or manually clone this repository
2. Update the git remote to point to your new repository

---

### 2️⃣ Update Site Configuration

Edit **`src/config/site.ts`** and update all the values for your new client:

#### Essential Updates:
- **Business name**: Change `business.name` from "Woodman and Olive" to your client's name
- **Logo text**: Update `business.logoText` (the badge shown in the header, e.g., "TP", "AM", "FD")
- **Brand colors**: Change the `branding.colors.primary` (e.g., from "amber" to "blue", "green", "purple")
- **Contact info**: Update `contact.phone`, `contact.email`, `contact.address`
- **Opening hours**: Update `hours.display` and `hours.lastBooking`
- **SEO/Meta tags**: Update all fields in the `seo` section
- **URLs**: Update `urls.domain`, `urls.basePath`, `urls.productionUrl`
- **Email**: Update `email.fromName`

💡 **Tip**: The config file is heavily commented. Read each section carefully!

---

### 3️⃣ Replace Brand Assets

Navigate to the `public/brand/` folder and replace these files:

| File | Purpose | Recommended Size |
|------|---------|------------------|
| `favicon.ico` | Browser tab icon | 32×32 or 64×64 px |
| `logo.png` (optional) | Full logo image | Variable |
| `hero.jpg` (optional) | Default hero background | 1920×800 px |
| `og-image.png` (optional) | Social share preview | 1200×630 px |

**Current asset**: The existing `favicon.ico` is from Woodman and Olive.

⚠️ **Important**: Keep the same filenames! If you use different names, update them in `src/config/site.ts` under `branding.assets`.

---

### 4️⃣ Set Up Supabase

#### Create Your Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish provisioning (~2 minutes)

#### Get Your Credentials
1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` key, not the `service_role` key)

#### Set Environment Variables
1. Copy `.env.example` to `.env` in your project root:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

#### Run Database Migrations
1. Install the Supabase CLI: https://supabase.com/docs/guides/cli
2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Find your project ref in the Supabase dashboard URL or Settings)

3. Push the database schema:
   ```bash
   supabase db push
   ```

---

### 5️⃣ Configure Email Service (Resend)

#### Set Up Resend
1. Create a free account at [https://resend.com](https://resend.com)
2. Verify your domain (or use the free `onboarding@resend.dev` for testing)
3. Generate an API key from the Resend dashboard

#### Add Secrets to Supabase
```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
supabase secrets set RESEND_FROM="Your Restaurant Name <bookings@yourdomain.com>"
```

💡 **For testing**: You can use `"Your Restaurant <onboarding@resend.dev>"` as the FROM address.

---

### 6️⃣ Test Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:8080](http://localhost:8080) in your browser

4. **Test checklist**:
   - [ ] Business name shows correctly in the header and hero
   - [ ] Logo badge displays your custom text
   - [ ] Brand colors match your config
   - [ ] Contact information is correct
   - [ ] You can create a test booking
   - [ ] Booking confirmation email arrives (check spam folder!)

---

### 7️⃣ Deploy to Production

#### Option A: Deploy with Lovable (if you're using Lovable)
1. Open your project in Lovable: https://lovable.dev
2. Click **Share** → **Publish**
3. Your site will be live at your configured domain

#### Option B: Deploy with Vercel
1. Push your code to GitHub
2. Connect your repository to Vercel: https://vercel.com
3. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

#### Option C: Deploy with Netlify
1. Push your code to GitHub
2. Connect your repository to Netlify: https://netlify.com
3. Add environment variables in Netlify
4. Set build command: `npm run build`
5. Set publish directory: `dist`

---

### 8️⃣ Connect Your Custom Domain

#### For Lovable:
Follow the guide: https://docs.lovable.dev/tips-tricks/custom-domain

#### For Vercel:
1. Go to your project settings → **Domains**
2. Add your domain and follow the DNS instructions

#### For Netlify:
1. Go to **Domain settings** → **Add custom domain**
2. Update your DNS records as instructed

---

## 🎨 Customization Beyond the Config

### Changing More Than Just Colors

If you need to customize beyond what's in the config file (e.g., layout changes, add new sections):

1. **Components are in**: `src/components/`
2. **Pages are in**: `src/pages/`
3. **Styles use**: Tailwind CSS utility classes

### Theme Colors

The app uses Tailwind's color palette. Available primary colors include:
- `amber` (current default)
- `blue`
- `green`
- `purple`
- `red`
- `pink`
- `indigo`
- `teal`
- `cyan`
- `emerald`

You can also define custom colors in `tailwind.config.ts` if needed.

---

## 🆘 Troubleshooting

### Build Fails
- Make sure `src/config/site.ts` is valid JavaScript/TypeScript
- Check that all required fields are filled in
- Run `npm run lint` to check for syntax errors

### Emails Not Sending
- Verify your Resend API key is correct
- Check Supabase Edge Function logs in the Supabase dashboard
- Confirm the `RESEND_FROM` email is verified in Resend

### Wrong Business Name Still Showing
- Clear your browser cache
- Make sure you updated `src/config/site.ts`
- Rebuild the app: `npm run build`

### Supabase Connection Errors
- Double-check your `.env` file has the correct values
- Ensure the Supabase project is not paused (free tier projects pause after 7 days of inactivity)

---

## 📝 Checklist Summary

Before going live, ensure:

- [ ] Updated `src/config/site.ts` with all client information
- [ ] Replaced assets in `public/brand/`
- [ ] Set up Supabase project and ran migrations
- [ ] Configured Resend and set Supabase secrets
- [ ] Tested locally and confirmed everything works
- [ ] Deployed to production hosting
- [ ] Connected custom domain
- [ ] Sent a test booking and received confirmation email

---

## 🎯 Next Steps After Deployment

1. **Add restaurant data**: Log in as admin and add your restaurant(s) to the database
2. **Customize content**: Update any hardcoded copy in components if needed
3. **Set up analytics**: Add Google Analytics or other tracking (optional)
4. **Configure backups**: Set up automated Supabase backups (recommended for production)

---

## 💡 Pro Tips

- **Keep configs in sync**: If you run multiple tp- sites, keep this repo as a template and pull updates regularly
- **Version your changes**: Commit your config changes so you can track what's different per client
- **Document customizations**: If you make changes beyond the config, document them in a `CUSTOMIZATIONS.md` file
- **Test bookings regularly**: Set up a recurring test booking to ensure emails still work

---

## 🔄 Updating from Core

After initial setup, your client site can receive updates from the upstream core repository. This allows new features and bug fixes to be rolled out to all client sites while preserving each client's specific configuration and branding.

**See [UPDATING.md](./UPDATING.md) for complete instructions on:**
- How to link your client repo to the upstream core
- Pulling updates with `npm run update-from-core`
- Handling merge conflicts
- Best practices for the multi-client architecture

---

## 🔗 Helpful Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)

---

## 🐛 Found an Issue?

If you encounter problems with the cloning process itself (not client-specific issues), please open an issue in the original tp-woodman repository.

---

**Last Updated**: October 2026
