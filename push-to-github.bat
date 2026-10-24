@echo off
echo ==========================================
echo   Web Suite Pro - Push to GitHub
echo ==========================================
set /p REPO_URL="Enter your GitHub Repo URL (e.g. https://github.com/user/repo.git): "
if "%REPO_URL%"=="" (
  echo Error: Repo URL cannot be empty!
  pause
  exit /b 1
)

git init
git add .
git commit -m "feat: complete web suite pro tools"
git branch -M main
git remote add origin %REPO_URL%
echo Pushing code to %REPO_URL%...
git push -u origin main
echo Done! Successfully pushed to GitHub!
pause
