# Updating Client Sites from Core

This guide explains how to push new features, bug fixes, and improvements from the **upstream core** (tp-core) to individual client restaurant sites.

## Overview

The tp-core repository serves as the **single source of truth** for all shared functionality. When you build a new feature or fix a bug here, you can roll it out to all client sites with one command.

**Key Principle:** Client-specific values (restaurant names, colors, contact info, brand assets) live in `src/config/site.ts` and `public/brand/`. Everything else is shared code that gets updated from this core repository.

---

## For Developers: Building Features in Core

### 1. Develop in the Core Repository

Work on new features in `tp-core` (this repo):

```bash
cd tp-core
git checkout -b feature/new-booking-flow
# ... make your changes ...
git add .
git commit -m "Add new booking flow"
git push origin feature/new-booking-flow
```

Create a PR, get it reviewed, and merge to `main`.

### 2. Test Before Rolling Out

Before updating clients:
1. Ensure the build passes: `npm run build`
2. Test locally: `npm run dev`
3. Check that `src/config/site.ts` still has all needed fields
4. Verify no hard-coded client-specific values snuck into shared code

### 3. Roll Out to Client Sites

For each client repository (e.g., `tp-woodman`, `tp-amicicoffee`, `tp-fishydelishy`):

```bash
# Navigate to the client repo
cd /path/to/tp-amicicoffee

# Pull updates from core
npm run update-from-core
```

That's it! The script will:
- Fetch the latest changes from `tp-core`
- Merge them into the current branch
- Keep the client's `site.ts` and brand assets untouched
- Run `npm install` and `npm run build`
- Report success or any conflicts

### 4. Test Each Client After Update

After updating a client repo:

```bash
npm run dev
```

Verify:
- The site loads correctly
- Client-specific branding is intact
- New features work as expected
- No console errors

### 5. Push to Production

Once verified:

```bash
git push origin main
```

Deploy through your usual pipeline (Lovable, Vercel, Netlify, etc.).

---

## Handling Merge Conflicts

### What Causes Conflicts?

Conflicts happen when:
- Both the core and a client modified the same shared file
- A file was renamed or moved in one place but edited in another
- Changes overlap in a way Git can't automatically resolve

### How to Resolve

If `npm run update-from-core` reports conflicts:

1. **Check which files conflict:**
   ```bash
   git status
   ```

2. **Open each conflicted file:**
   Look for conflict markers:
   ```
   <<<<<<< HEAD
   // Client's version
   =======
   // Core's version
   >>>>>>> core/main
   ```

3. **Decide what to keep:**
   - For **shared code files**: Usually keep the core's version (bottom section)
   - For **site.ts or brand assets**: Should never conflict (protected by `.gitattributes`)
   - For **genuine conflicts**: Merge both changes intelligently

4. **Remove the markers and save:**
   Edit the file to remove `<<<<<<<`, `=======`, and `>>>>>>>` lines, keeping only the final merged content.

5. **Mark as resolved:**
   ```bash
   git add src/path/to/resolved-file.ts
   ```

6. **Complete the merge:**
   ```bash
   git commit
   ```

7. **Verify the build:**
   ```bash
   npm install
   npm run build
   npm run dev
   ```

### Abort a Merge

If you want to cancel and try again:
```bash
git merge --abort
```

---

## Special Cases

### First Update from Template Repos

If a client repo was created using "Use this template" on GitHub, it will have **unrelated history** from the core. The first update will automatically handle this with `--allow-unrelated-histories`. You'll see a message like:

```
📝 Detected unrelated histories (common for template-based repos).
   Will use --allow-unrelated-histories for this merge.
```

This is expected and handled automatically. Subsequent updates won't have this issue.

### Migrating Older Client Repos

If you have an older client site (like `tp-amicicoffee` or `tp-fishydelishy`) that was built **before** the config-driven system existed, you'll need to migrate it first:

1. **Back up the repo:**
   ```bash
   git checkout -b backup-before-migration
   git push origin backup-before-migration
   ```

2. **Create the config file:**
   - Copy `src/config/site.ts` from the core
   - Extract all client-specific values from hardcoded spots
   - Fill in the `siteConfig` object

3. **Create brand directory:**
   ```bash
   mkdir -p public/brand
   # Move existing logo, favicon, etc. into public/brand/
   ```

4. **Add `.gitattributes`:**
   Copy from the core repo.

5. **Update imports:**
   Search the codebase for any hardcoded values and replace with:
   ```typescript
   import { siteConfig } from '@/config/site';
   // Then use: siteConfig.name, siteConfig.brand.logo, etc.
   ```

6. **Test thoroughly:**
   ```bash
   npm run dev
   ```

7. **Commit the migration:**
   ```bash
   git add .
   git commit -m "Migrate to config-driven structure"
   git push origin main
   ```

8. **Link to core:**
   ```bash
   bash scripts/link-to-core.sh
   ```

Now the client can receive updates normally.

---

## Best Practices

### ✅ DO:
- Build new features in the **core** (`tp-core`)
- Keep client-specific values in `src/config/site.ts`
- Use the config throughout the codebase: `import { siteConfig } from '@/config/site'`
- Test updates in a local client repo before pushing to production
- Document breaking changes when updating the `site.ts` schema

### ❌ DON'T:
- Hardcode client names, colors, or contact info in shared components
- Edit core files directly in client repos (changes will be lost on update)
- Skip testing after an update
- Force-push without understanding what you're overwriting

### Golden Rule:
> **If it varies between clients, it goes in `site.ts`.**  
> **If it's the same for everyone, it belongs in the core.**

---

## Core Repository

The `tp-core` repository at https://github.com/RichardHubbert/tp-core is the neutral upstream template that all client sites derive from. It contains no client-specific branding or configuration.

---

## Troubleshooting

### "Core remote not found"
Run this in the client repo:
```bash
bash scripts/link-to-core.sh
```

### "Fatal: refusing to merge unrelated histories"
This should be handled automatically. If not, add the flag manually:
```bash
git merge core/main --allow-unrelated-histories
```

### Build fails after update
1. Check for new dependencies: `npm install`
2. Check for TypeScript errors: `npm run build`
3. Look for console errors: `npm run dev`
4. Compare your `site.ts` with the core's version—new fields may be required

### Protected files still getting overwritten
Ensure the merge driver is configured:
```bash
git config merge.ours.driver true
```

This should have been set by `link-to-core.sh`, but double-check.

### Need to update the core URL
Edit `scripts/link-to-core.sh` and change `CORE_REPO_URL`, then:
```bash
git remote set-url core https://github.com/RichardHubbert/tp-core.git
```

---

## Summary Workflow

### One-Time Setup (Per Client)
```bash
bash scripts/link-to-core.sh
```

### Updating (Anytime)
```bash
npm run update-from-core
# ... test ...
git push origin main
```

### Building New Features
1. Develop in `tp-core` (this repo)
2. Merge to `main`
3. For each client (including tp-woodman): `npm run update-from-core`
4. Test and deploy

---

## Questions?

- **Setup issues:** See [CLONING.md](./CLONING.md)
- **Development questions:** See [README.md](./README.md)
- **Git help:** https://git-scm.com/docs
