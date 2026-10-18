# tp-core Migration Summary

## ✅ Completed Tasks

### 1. Repository Neutralization
tp-core has been successfully transformed from a copy of tp-woodman into a neutral upstream template.

**All client-specific references removed:**
- ✅ Woodman and Olive → "Your Restaurant Name"
- ✅ Olive-specific branding → Generic placeholders
- ✅ Client domain/URLs → Generic examples
- ✅ Supabase/API IDs → Placeholder values
- ✅ Email fallbacks → Generic defaults

### 2. Documentation Updates
All documentation now reflects tp-core as the neutral upstream:
- ✅ README.md - Describes tp-core as the template repository
- ✅ CLONING.md - Updated for creating new clients from tp-core
- ✅ UPDATING.md - Updated to reference tp-core as upstream
- ✅ CRM integration docs - Removed client-specific IDs
- ✅ Scripts - Point to https://github.com/RichardHubbert/tp-core.git

### 3. Build Verification
✅ Build passes successfully (`npm run build` - 2.75s)

### 4. Pull Request
✅ PR created and ready for review: **https://github.com/RichardHubbert/tp-core/pull/1**

---

## 📋 What's Next: Repointing Existing Clients

After the PR is merged, existing client repositories need to be repointed to tp-core.

### Affected Repositories
1. **tp-woodman** (Woodman and Olive)
2. **tp-amicicoffee** (Amici Coffee)
3. **tp-fishydelishy** (Fishy Delishy)

### Quick Steps (Detailed guide in REPOINTING_CLIENTS.md)

For each client repository:

```bash
# 1. Navigate to client repo
cd /path/to/tp-woodman  # (or tp-amicicoffee, tp-fishydelishy)

# 2. Update the core remote URL
git remote set-url core https://github.com/RichardHubbert/tp-core.git

# 3. Update scripts/link-to-core.sh
# Change CORE_REPO_URL from tp-woodman to tp-core
# Then commit the change

# 4. Run the update (handles --allow-unrelated-histories automatically)
npm run update-from-core

# 5. Verify your client config is intact
cat src/config/site.ts | grep "business:"
# Should show YOUR business name, not "Your Restaurant Name"

# 6. Test locally
npm run dev

# 7. Push
git push origin main

# 8. Deploy
```

### ⚠️ Important Notes

1. **Unrelated Histories**: tp-core has unrelated history from the client repos since it was neutralized. The first merge needs `--allow-unrelated-histories`, which `update-from-core.sh` handles automatically.

2. **Protected Files**: These files are protected by `.gitattributes` and won't be overwritten:
   - `src/config/site.ts` (your client configuration)
   - `public/brand/**` (your brand assets)
   - `.env` files

3. **One-Time Process**: After the first merge, future updates are simple: just `npm run update-from-core`

---

## 🎯 Repository Architecture

### tp-core (This Repository)
**Role**: Neutral upstream template  
**Contains**: Shared logic, components, migrations, build config  
**Does NOT Contain**: Any client-specific branding, IDs, or configuration

### Client Repositories
**Examples**: tp-woodman, tp-amicicoffee, tp-fishydelishy  
**Contains**: Client-specific `site.ts` config and `brand/` assets  
**Upstream**: Links to tp-core via `core` remote  
**Updates**: Pull shared updates via `npm run update-from-core`

### Update Flow
```
tp-core (main) ─────> tp-woodman (main)
                 ├──> tp-amicicoffee (main)
                 └──> tp-fishydelishy (main)
```

---

## 📖 Documentation Reference

| Document | Purpose |
|----------|---------|
| **README.md** | Overview of tp-core as neutral template |
| **CLONING.md** | How to create a NEW client site from tp-core |
| **UPDATING.md** | How to push updates from tp-core to clients |
| **REPOINTING_CLIENTS.md** | Step-by-step guide for migrating existing clients to tp-core |
| **MIGRATION_SUMMARY.md** | This document - overview of the migration |

---

## 🚀 Future Workflow

### For New Features
1. Develop in tp-core (this repo)
2. Test and merge to `main`
3. Roll out to clients: each client runs `npm run update-from-core`

### For New Clients
1. Create new repo from tp-core template
2. Edit `src/config/site.ts` with client details
3. Replace `public/brand/` assets
4. Set up Supabase and deploy

### For Client-Specific Customizations
1. Make changes directly in client repo
2. Client-specific files are protected from core updates
3. Push and deploy from client repo

---

## ✨ Benefits of This Architecture

1. **Single Source of Truth**: Bug fixes and features developed once in tp-core
2. **Easy Rollout**: One command (`npm run update-from-core`) to update all clients
3. **Protected Customizations**: Client configs never overwritten by core updates
4. **Clean Separation**: Core has zero client-specific code
5. **Scalable**: Easy to add new clients without duplicating code

---

## 🔗 Links

- **PR**: https://github.com/RichardHubbert/tp-core/pull/1
- **Core Repo**: https://github.com/RichardHubbert/tp-core
- **Client Repos**:
  - https://github.com/RichardHubbert/tp-woodman
  - https://github.com/RichardHubbert/tp-amicicoffee
  - https://github.com/RichardHubbert/tp-fishydelishy

---

**Created**: October 2026  
**Status**: ✅ Ready for PR merge and client repointing
