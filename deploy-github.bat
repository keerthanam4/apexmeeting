@echo off
echo ========================================================
echo   ApexMeeting - GitHub Pages One-Click Push & Deploy
echo ========================================================
echo.
set /p REPO_URL="Enter your GitHub Repository URL (e.g., https://github.com/yourname/apexmeeting.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] No URL provided. Exiting.
    pause
    exit /b
)

echo.
echo [1/3] Adding remote origin...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo [2/3] Renaming branch to main...
git branch -M main

echo [3/3] Pushing to GitHub...
git push -u origin main

echo.
echo ========================================================
echo   Push complete!
echo   Next steps:
echo   1. Open your repository on GitHub.
echo   2. Go to Settings -> Pages.
echo   3. Under 'Source', select 'GitHub Actions'.
echo   4. Your site will be live at:
echo      https://<YOUR_USERNAME>.github.io/apexmeeting/
echo ========================================================
pause
