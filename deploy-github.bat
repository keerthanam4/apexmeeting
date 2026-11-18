@echo off
echo ========================================================
echo   ApexMeeting - Deploying to GitHub (keerthanam4/apexmeeting)
echo ========================================================
echo.
echo Pushing to https://github.com/keerthanam4/apexmeeting.git...
git branch -M main
git push -u origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [NOTE] If you got 'repository not found', please make sure you created the repo at:
    echo        https://github.com/new?name=apexmeeting
    echo.
) else (
    echo.
    echo ========================================================
    echo   Success! Code pushed to GitHub!
    echo   Now go to:
    echo   https://github.com/keerthanam4/apexmeeting/settings/pages
    echo   Under 'Source', select 'GitHub Actions'.
    echo.
    echo   Your site will be live at:
    echo   https://keerthanam4.github.io/apexmeeting/
    echo ========================================================
)
pause
