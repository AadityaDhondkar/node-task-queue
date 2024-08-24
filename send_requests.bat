@echo off
setlocal enabledelayedexpansion

set user_id=100

for /L %%i in (1,1,61) do (
    curl -X POST http://localhost:3000/api/v1/task -H "Content-Type: application/json" -d "{\"user_id\":\"!user_id!\"}"
    echo.
    set /a user_id+=1
)

endlocal

