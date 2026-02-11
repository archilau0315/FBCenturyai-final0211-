@echo off
echo Phase 0: Process Cleanup
REM 尝试关闭正在运行的旧程序进程
taskkill /F /IM FB_Century_AI_Architect.exe /T >nul 2>&1
REM 等待一秒确保文件句柄释放
timeout /t 1 /nobreak >nul

echo Phase 1: Cleaning Workspace
if exist "dist\FB_Century_AI_Architect.exe" del /f /q "dist\FB_Century_AI_Architect.exe"
if exist "FB_Century_AI_Architect.exe" del /f /q "FB_Century_AI_Architect.exe"
if exist "build" rd /s /q "build"
if exist "*.spec" del /q "*.spec"

echo Phase 2: Checking Environment
python --version
if %errorlevel% neq 0 (
    echo Error: Python not found in PATH
    pause
    exit /b
)

echo Phase 3: Updating Python Dependencies
python -m pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple
python -m pip install pyinstaller fastapi uvicorn requests wmi pywin32 h11 starlette httptools -i https://pypi.tuna.tsinghua.edu.cn/simple

echo Phase 4: Building Frontend Assets
if not exist "node_modules" call npm install
call npm run build

if not exist "dist\index.html" (
    echo Error: Frontend build failed, dist folder is empty or build crashed.
    pause
    exit /b
)

echo Phase 5: Preparing Assets
if exist "logo.png" copy /Y "logo.png" "dist\"

echo Phase 6: Executing PyInstaller (Output to Root)
REM 使用 --distpath "." 将生成的 EXE 放在项目根目录，避开 dist 文件夹冲突
python -m PyInstaller --noconfirm --onefile --windowed --collect-all uvicorn --collect-all fastapi --collect-all starlette --collect-all h11 --collect-all httptools --add-data "dist;dist" --distpath "." --name "FB_Century_AI_Architect" server.py

if %errorlevel% neq 0 (
    echo Error: Packaging process failed.
    pause
    exit /b
)

echo Success: ARCHIVE GENERATED AT PROJECT ROOT (FB_Century_AI_Architect.exe)
pause