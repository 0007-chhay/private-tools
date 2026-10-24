#!/bin/bash
# Web Suite Pro - GitHub Auto Push Helper
echo "=========================================="
echo "  Web Suite Pro - Push to GitHub"
echo "=========================================="
read -p "Enter your GitHub Repo URL (e.g. https://github.com/user/repo.git): " REPO_URL
if [ -z "$REPO_URL" ]; then
  echo "Error: Repo URL cannot be empty!"
  exit 1
fi

git init
git add .
git commit -m "feat: complete web suite pro tools"
git branch -M main
git remote add origin "$REPO_URL"
echo "Pushing code to $REPO_URL..."
git push -u origin main
echo "Done! Successfully pushed to GitHub!"
