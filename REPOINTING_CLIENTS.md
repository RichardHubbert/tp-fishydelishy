# Repointing Existing Clients to tp-core

This guide provides the exact steps for repointing existing tp- client repositories (tp-woodman, tp-amicicoffee, tp-fishydelishy) to use tp-core as their upstream instead of tp-woodman.

## Background

**Previous Setup:**
- tp-woodman served as both a client site AND the upstream template
- Other clients (tp-amicicoffee, tp-fishydelishy) pointed to tp-woodman as their upstream

**New Setup:**
- **tp-core** is the neutral upstream template (no client-specific branding)
- **tp-woodman** is now a client site like any other
- All client sites point to tp-core as their upstream

## Important Notes

⚠️ **Unrelated Histories**: tp-core was created from tp-woodman but has had its history neutralized. The first merge will require `--allow-unrelated-histories`, which is automatically handled by `update-from-core.sh`.

✅ **Protected Files**: Your client-specific files (`src/config/site.ts`, `public/brand/**`) are protected by `.gitattributes` and will never be overwritten during merges from tp-core.

---

## Step-by-Step Instructions

Follow these steps **for each client repository**: tp-woodman, tp-amicicoffee, tp-fishydelishy.

### 1. Navigate to Your Client Repository

```bash
# Example for tp-woodman
cd /path/to/tp-woodman

# Verify you're in the right repository
git remote -v
```

You should see your origin pointing to your client repo (e.g., `https://github.com/RichardHubbert/tp-woodman`).

### 2. Check Current Branch and Status

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Ensure you have no uncommitted changes
git status
```

If you have uncommitted changes, either commit them or stash them before proceeding.

### 3. Update the Core Remote URL

**If you already have a 'core' remote** (most likely pointing to tp-woodman):

```bash
# Update the core remote to point to tp-core
git remote set-url core https://github.com/RichardHubbert/tp-core.git

# Verify the change
git remote -v
```

You should now see:
```
core    https://github.com/RichardHubbert/tp-core.git (fetch)
core    https://github.com/RichardHubbert/tp-core.git (push)
origin  https://github.com/RichardHubbert/YOUR_CLIENT_REPO.git (fetch)
origin  https://github.com/RichardHubbert/YOUR_CLIENT_REPO.git (push)
```

**If you don't have a 'core' remote yet**:

```bash
# Run the link script (it now points to tp-core)
bash scripts/link-to-core.sh
```

### 4. Update the Scripts (Important!)

Your local `scripts/link-to-core.sh` still has the old URL. Update it:

```bash
# Open the file
nano scripts/link-to-core.sh
# OR
code scripts/link-to-core.sh
```

Find this line:
```bash
CORE_REPO_URL="https://github.com/RichardHubbert/tp-woodman.git"
```

Change it to:
```bash
CORE_REPO_URL="https://github.com/RichardHubbert/tp-core.git"
```

Save the file, then commit the change:

```bash
git add scripts/link-to-core.sh
git commit -m "Update core remote to tp-core"
git push origin main
```

### 5. Fetch from the New Core Remote

```bash
# Fetch the latest from tp-core
git fetch core main
```

You should see it fetching from `https://github.com/RichardHubbert/tp-core`.

### 6. Perform the First Merge from tp-core

**Option A: Using the Update Script (Recommended)**

```bash
npm run update-from-core
```

The script will:
- Detect unrelated histories automatically
- Use `--allow-unrelated-histories` for the first merge
- Protect your client-specific files
- Run `npm install` and `npm run build`

**Option B: Manual Merge**

```bash
# Merge with --allow-unrelated-histories
git merge core/main --allow-unrelated-histories -m "Repoint to tp-core as upstream"

# Install dependencies
npm install

# Build to verify
npm run build
```

### 7. Verify Your Client-Specific Config Was Preserved

```bash
# Check your site config
cat src/config/site.ts | grep "business:"
```

You should still see YOUR client's business name (e.g., "Woodman and Olive", "Amici Coffee"), NOT "Your Restaurant Name".

If you see "Your Restaurant Name", your `.gitattributes` protection didn't work. Restore your config:

```bash
# Restore your client config
git checkout HEAD~1 src/config/site.ts
git add src/config/site.ts
git commit -m "Restore client-specific site config"
```

### 8. Test Locally

```bash
# Start the development server
npm run dev
```

Open http://localhost:8080 and verify:
- ✅ Your business name appears correctly
- ✅ Your brand colors are correct
- ✅ Your logo/branding is intact
- ✅ No references to "Your Restaurant Name" or other placeholders

### 9. Push the Merge

```bash
git push origin main
```

### 10. Deploy

Deploy to your production environment through your usual process (Vercel, Netlify, Lovable, etc.).

---

## Expected Behavior

### What SHOULD Change (Updates from Core)
- ✅ Shared components and logic
- ✅ Bug fixes and features
- ✅ Database migrations
- ✅ Dependency updates
- ✅ Build configuration

### What SHOULD NOT Change (Protected)
- ❌ `src/config/site.ts` - Your client configuration
- ❌ `public/brand/**` - Your brand assets
- ❌ `.env` files - Your environment variables

---

## Troubleshooting

### Issue: "fatal: refusing to merge unrelated histories"

**Solution**: Add the `--allow-unrelated-histories` flag manually:

```bash
git merge core/main --allow-unrelated-histories -m "Repoint to tp-core"
```

Or just run `npm run update-from-core` which handles this automatically.

---

### Issue: My client config was overwritten

**Symptoms**: You see "Your Restaurant Name" instead of your actual business name.

**Cause**: `.gitattributes` wasn't properly set up before the merge.

**Solution**:

```bash
# 1. Restore your client config from before the merge
git show HEAD~1:src/config/site.ts > src/config/site.ts

# 2. Ensure .gitattributes is correct
cat .gitattributes

# Should contain:
# src/config/site.ts merge=ours
# public/brand/** merge=ours

# 3. Configure the merge driver
git config merge.ours.driver true

# 4. Commit your restored config
git add src/config/site.ts
git commit -m "Restore client-specific configuration"

# 5. Push
git push origin main
```

---

### Issue: Build fails after merge

**Solution**:

```bash
# 1. Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# 2. Reinstall
npm install

# 3. Try building again
npm run build
```

---

### Issue: Brand assets are missing

**Check the public/brand/ directory**:

```bash
ls -la public/brand/
```

Your assets should still be there. If they're missing, they weren't committed before the merge.

**Solution**: Restore them from your backup or re-add them:

```bash
# Copy your brand assets back
cp /path/to/backup/brand/* public/brand/

# Commit them
git add public/brand/
git commit -m "Restore brand assets"
git push origin main
```

---

## Summary Checklist

For each client repository (tp-woodman, tp-amicicoffee, tp-fishydelishy):

- [ ] Update core remote to `https://github.com/RichardHubbert/tp-core.git`
- [ ] Update `scripts/link-to-core.sh` with new URL
- [ ] Fetch from new core remote
- [ ] Merge with `--allow-unrelated-histories`
- [ ] Verify client config was preserved
- [ ] Test locally
- [ ] Build passes
- [ ] Push to origin
- [ ] Deploy to production

---

## Future Updates

After this one-time repointing, future updates are simple:

```bash
# In any client repo
npm run update-from-core
```

This will:
- Fetch from tp-core
- Merge updates
- Protect your client-specific files
- Install dependencies
- Verify the build

No more `--allow-unrelated-histories` needed after the first merge!

---

## Questions?

- **Can I still customize my client site?** Yes! Edit `src/config/site.ts` and `public/brand/` as before.
- **What if I made custom code changes?** They'll be preserved. Only shared components and logic are updated from core.
- **Can I contribute back to core?** Yes! Make changes in tp-core and they'll be available to all clients.

---

**Last Updated**: October 2026
