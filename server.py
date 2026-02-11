
import hashlib
import uvicorn
import wmi
import requests
import os
import sys
import webbrowser
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# ==========================================
# 0. 路径适配逻辑
# ==========================================
if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
else:
    base_path = os.path.dirname(os.path.abspath(__file__))

dist_path = os.path.join(base_path, "dist")
logo_path = os.path.join(base_path, "logo.png")

# ==========================================
# 允许跨域 (CORS)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 1. 机器码与授权逻辑 (路由同步为中划线风格)
# ==========================================
def get_machine_id():
    try:
        c = wmi.WMI()
        cpu_id = c.Win32_Processor()[0].ProcessorId.strip()
        board_id = c.Win32_BaseBoard()[0].SerialNumber.strip()
        combined = f"FBC-KPF-ARCH-{cpu_id}-{board_id}"
        return hashlib.md5(combined.encode()).hexdigest().upper()[:16]
    except:
        return "HARDWARE-ERR-ID"

@app.get("/api/machine-id")
async def fetch_id():
    return {"machine_id": get_machine_id()}

@app.api_route("/api/verify-license", methods=["POST", "OPTIONS"])
async def verify(request: Request):
    if request.method == "OPTIONS":
        return JSONResponse(content="OK")
    try:
        data = await request.json()
        user_key = data.get("key", "").strip().upper()
        machine_id = get_machine_id()
        
        # 内部逻辑与 authService 同步
        secret_salt = "FANG_BIAO_CENTURY_ARCH_SECURE_2025"
        
        # 简单的绕过逻辑
        if user_key == "ARCHPRO2025ADMINX":
            return {"valid": True}

        # 这里仅为基础演示，实际打包时可以引入更复杂的日期校验
        return {"valid": True} # 生产环境建议连接数据库或解析日期
    except:
        return JSONResponse(status_code=400, content={"error": "Invalid format"})

# ==========================================
# 2. Logo 与 代理功能
# ==========================================
@app.get("/api/logo")
async def get_logo():
    if os.path.exists(logo_path):
        return FileResponse(logo_path)
    return {"error": "No logo found"}

# ==========================================
# 3. 前端静态托管
# ==========================================
if os.path.exists(dist_path):
    assets_path = os.path.join(dist_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{catchall:path}")
    async def serve_react_app(catchall: str):
        file_path = os.path.join(dist_path, catchall)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_path, "index.html"))

# ==========================================
# 4. 启动配置
# ==========================================
if __name__ == "__main__":
    if sys.stdout is None: sys.stdout = open(os.devnull, "w")
    if sys.stderr is None: sys.stderr = open(os.devnull, "w")

    if os.environ.get("RUN_MAIN") != "true":
        webbrowser.open("http://127.0.0.1:8000")

    uvicorn.run(app, host="127.0.0.1", port=8000)
