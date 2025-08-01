#!/bin/bash

# Bitbucket Repository Creation Script (API Token Based)
# Usage: export BITBUCKET_USERNAME="your-username" (optional)
#        ./create-bitbucket-repo.sh

set -e

# API Token (can be set as environment variable or hardcoded)
BITBUCKET_API_TOKEN="${BITBUCKET_API_TOKEN:-ATBByfLbFp4vqvPc8PbkTJadeEkb2EF67C99}"

# Username
BITBUCKET_USERNAME="${BITBUCKET_USERNAME:-hbpdev@htic.iitm.ac.in}"

echo "Using username: $BITBUCKET_USERNAME"

REPO_NAME="sivademo"
PROJECT_NAME="sivaDemo"

echo "Creating Bitbucket repository: $REPO_NAME"

# Create repository via Bitbucket API
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/bitbucket_response.json \
    -X POST \
    -H "Content-Type: application/json" \
    -u "$BITBUCKET_USERNAME:$BITBUCKET_API_TOKEN" \
    -d '{
        "name": "'$REPO_NAME'",
        "description": "Next.js Filename Generator Application - Enterprise Grade",
        "is_private": false,
        "scm": "git",
        "project": {
            "key": "PROJ"
        }
    }' \
    "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_USERNAME/$REPO_NAME")

HTTP_CODE="${RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Repository created successfully!"
    
    # Get repository details
    REPO_URL=$(curl -s -u "$BITBUCKET_USERNAME:$BITBUCKET_API_TOKEN" \
        "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_USERNAME/$REPO_NAME" | \
        python3 -c "import sys, json; print(json.load(sys.stdin)['links']['clone'][0]['href'])")
    
    echo "Repository URL: $REPO_URL"
    
    # Add Bitbucket remote
    echo "Adding Bitbucket remote..."
    git remote add bitbucket "$REPO_URL" 2>/dev/null || git remote set-url bitbucket "$REPO_URL"
    
    # Push to Bitbucket
    echo "Pushing code to Bitbucket..."
    git push -u bitbucket master
    
    echo "✅ Code pushed to Bitbucket successfully!"
    echo "Repository: https://bitbucket.org/$BITBUCKET_USERNAME/$REPO_NAME"
    
elif [ "$HTTP_CODE" = "400" ]; then
    echo "❌ Repository might already exist or invalid parameters"
    [ -f /tmp/bitbucket_response.json ] && cat /tmp/bitbucket_response.json
else
    echo "❌ Failed to create repository. HTTP Code: $HTTP_CODE"
    [ -f /tmp/bitbucket_response.json ] && cat /tmp/bitbucket_response.json
    echo ""
    echo "Testing authentication..."
    curl -s -u "hbpdev@htic.iitm.ac.in:$BITBUCKET_API_TOKEN" "https://api.bitbucket.org/2.0/user" | head -100
fi

# Cleanup
rm -f /tmp/bitbucket_response.json