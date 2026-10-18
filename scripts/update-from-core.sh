#!/bin/bash
#
# Update from Core Repository
# 
# Fetch and merge updates from the upstream core repository while preserving
# client-specific configuration and assets.
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Updating from upstream core...${NC}"
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo -e "${RED}❌ Error: Not in a git repository.${NC}"
    exit 1
fi

# Check if core remote exists
if ! git remote get-url core &>/dev/null; then
    echo -e "${RED}❌ Error: 'core' remote not found.${NC}"
    echo "   Run this first: ./scripts/link-to-core.sh"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes.${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Fetch from core
echo -e "${BLUE}📥 Fetching from core...${NC}"
if ! git fetch core main; then
    echo -e "${RED}❌ Failed to fetch from core remote.${NC}"
    exit 1
fi
echo ""

# Check if this looks like the first merge (detect unrelated histories)
if ! git merge-base HEAD core/main &>/dev/null; then
    echo -e "${YELLOW}📝 Detected unrelated histories (common for template-based repos).${NC}"
    echo "   Will use --allow-unrelated-histories for this merge."
    echo ""
    MERGE_FLAGS="--allow-unrelated-histories"
else
    MERGE_FLAGS=""
fi

# Attempt the merge
echo -e "${BLUE}🔀 Merging core/main into $CURRENT_BRANCH...${NC}"
echo ""

if git merge core/main $MERGE_FLAGS -m "Update from upstream core"; then
    echo ""
    echo -e "${GREEN}✅ Merge successful!${NC}"
    echo ""
    
    # Run npm install in case dependencies changed
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
    echo ""
    
    # Run build to verify everything works
    echo -e "${BLUE}🔨 Building project...${NC}"
    if npm run build; then
        echo ""
        echo -e "${GREEN}✅ Build successful!${NC}"
        echo ""
        echo -e "${GREEN}════════════════════════════════════════${NC}"
        echo -e "${GREEN}  Update Complete!${NC}"
        echo -e "${GREEN}════════════════════════════════════════${NC}"
        echo ""
        echo "Summary:"
        echo "  ✓ Merged updates from core/main"
        echo "  ✓ Client config preserved (src/config/site.ts)"
        echo "  ✓ Brand assets preserved (public/brand/)"
        echo "  ✓ Dependencies installed"
        echo "  ✓ Build verified"
        echo ""
        echo "Next steps:"
        echo "  - Review changes: git log --oneline -10"
        echo "  - Test locally: npm run dev"
        echo "  - Push updates: git push origin $CURRENT_BRANCH"
    else
        echo ""
        echo -e "${YELLOW}⚠️  Build failed. Please review errors above.${NC}"
        echo "   The merge is complete, but there may be issues to fix."
        exit 1
    fi
else
    echo ""
    echo -e "${RED}════════════════════════════════════════${NC}"
    echo -e "${RED}  Merge Conflict Detected${NC}"
    echo -e "${RED}════════════════════════════════════════${NC}"
    echo ""
    echo "What happened:"
    echo "  There are conflicting changes between your client code"
    echo "  and the upstream core updates."
    echo ""
    echo "How to resolve:"
    echo ""
    echo "  1. Check which files have conflicts:"
    echo "     git status"
    echo ""
    echo "  2. For each conflicted file:"
    echo "     - Open it in your editor"
    echo "     - Look for conflict markers: <<<<<<< HEAD"
    echo "     - Decide which changes to keep"
    echo "     - Remove the conflict markers"
    echo "     - Save the file"
    echo ""
    echo "  3. Mark conflicts as resolved:"
    echo "     git add <resolved-file>"
    echo ""
    echo "  4. Complete the merge:"
    echo "     git commit"
    echo ""
    echo "  5. Install and build:"
    echo "     npm install && npm run build"
    echo ""
    echo "Or, to abort this merge:"
    echo "     git merge --abort"
    echo ""
    echo "💡 Tip: Protected files (src/config/site.ts, public/brand/**)"
    echo "   should not conflict. If they do, choose YOUR version."
    echo ""
    exit 1
fi
