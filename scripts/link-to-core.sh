#!/bin/bash
#
# Link to Core Repository
# 
# Run this script once in a client repository to connect it to the upstream core.
# This sets up the remote and configures merge strategies for client-specific files.
#

set -e

# Core repository URL - change this if the core repo is renamed
<<<<<<< HEAD
CORE_REPO_URL="https://github.com/RichardHubbert/tp-core.git"
=======
CORE_REPO_URL="https://github.com/RichardHubbert/tp-woodman.git"
>>>>>>> woodman/main

echo "🔗 Linking to upstream core repository..."
echo "Core URL: $CORE_REPO_URL"
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not in a git repository. Please run this from the root of your client repo."
    exit 1
fi

# Add the core remote if it doesn't exist
if git remote get-url core &>/dev/null; then
    echo "✓ Core remote already exists:"
    git remote get-url core
    echo ""
    read -p "Update to $CORE_REPO_URL? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url core "$CORE_REPO_URL"
        echo "✓ Core remote URL updated"
    fi
else
    git remote add core "$CORE_REPO_URL"
    echo "✓ Added 'core' remote"
fi

# Set up the merge driver for client-specific files
echo ""
echo "Setting up merge strategy for client-specific files..."
if git config merge.ours.driver &>/dev/null; then
    echo "✓ Merge driver already configured"
else
    git config merge.ours.driver true
    echo "✓ Configured merge.ours.driver"
fi

# Verify .gitattributes exists
if [ ! -f .gitattributes ]; then
    echo ""
    echo "⚠️  Warning: .gitattributes not found!"
    echo "   Your client-specific files may not be protected during merges."
    echo "   Consider adding .gitattributes from the core repository."
fi

# Create required directories if they don't exist
mkdir -p src/config
mkdir -p public/brand

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Ensure src/config/site.ts is customized for your client"
echo "  2. Add your brand assets to public/brand/"
echo "  3. Copy .env.example to .env and configure it"
echo "  4. Run: npm run update-from-core"
echo ""
echo "The 'core' remote is now available. You can:"
echo "  - Update from core:  npm run update-from-core"
echo "  - Fetch core branch: git fetch core main"
echo "  - View core remote:  git remote -v"
