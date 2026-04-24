# GushiinaBlog 开发环境启动脚本 (Windows PowerShell)
# 使用方法: .\deploy.ps1 [选项]
# 选项:
#   -Help       显示帮助信息
#   -Clean      清理依赖并重新安装

param(
    [switch]$Help,
    [switch]$Clean
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 颜色定义
function Write-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

function Write-Warn($message) {
    Write-Host "[WARN] $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# 错误处理
function Error-Exit($message) {
    Write-Error $message
    exit 1
}

# 显示帮助
function Show-Help {
    @"
GushiinaBlog 开发环境启动脚本

使用方法: .\deploy.ps1 [选项]

选项:
    -Help       显示此帮助信息
    -Clean      清理依赖并重新安装

示例:
    .\deploy.ps1              # 启动开发环境
    .\deploy.ps1 -Clean       # 清理依赖并重新安装

"@
}

# 检查命令是否存在
function Test-Command($command) {
    return [bool](Get-Command -Name $command -ErrorAction SilentlyContinue)
}

# 检查环境
function Check-Environment {
    Write-Info "检查系统环境..."
    
    # 检查操作系统
    Write-Info "检测到操作系统: Windows"
    
    # 检查 Node.js
    if (-not (Test-Command "node")) {
        Error-Exit "Node.js 未安装，请先安装 Node.js >= 20"
    } else {
        $NODE_VERSION = node --version
        Write-Success "Node.js 已安装: $NODE_VERSION"
        
        # 检查版本是否 >= 20
        $MAJOR_VERSION = [int]($NODE_VERSION -replace 'v', '' -replace '\..*', '')
        if ($MAJOR_VERSION -lt 20) {
            Write-Warn "Node.js 版本过低 (需要 >= 20)，建议升级"
        }
    }
    
    # 检查 npm
    if (-not (Test-Command "npm")) {
        Error-Exit "npm 未安装，请安装 Node.js"
    } else {
        $NPM_VERSION = npm --version
        Write-Success "npm 已安装: $NPM_VERSION"
    }
}

# 安装依赖
function Install-Dependencies {
    Write-Info "安装后端依赖..."
    Set-Location DailyBlog\backend
    
    if ($script:CLEAN_MODE) {
        Write-Info "清理现有依赖..."
        Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
        Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
    }
    
    npm install
    Write-Success "后端依赖安装完成"
    
    Write-Info "安装前端依赖..."
    Set-Location ..\frontend
    
    if ($script:CLEAN_MODE) {
        Write-Info "清理现有依赖..."
        Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
        Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
    }
    
    npm install
    Write-Success "前端依赖安装完成"
    
    Set-Location ..\..
}

# 启动开发服务
function Start-DevServices {
    Write-Info "启动开发环境..."
    
    # 启动后端（后台作业）
    Write-Info "启动后端服务..."
    $script:BACKEND_JOB = Start-Job -ScriptBlock {
        Set-Location $using:PWD\DailyBlog\backend
        npm run dev
    }
    Write-Success "后端服务已启动"
    
    # 等待一下确保后端启动
    Start-Sleep -Seconds 3
    
    # 启动前端（后台作业）
    Write-Info "启动前端服务..."
    $script:FRONTEND_JOB = Start-Job -ScriptBlock {
        Set-Location $using:PWD\DailyBlog\frontend
        npm run dev
    }
    Write-Success "前端服务已启动"
    
    Write-Success "开发环境已启动!"
    Write-Info "后端: http://localhost:3001"
    Write-Info "前端: http://localhost:3000"
    Write-Info ""
    Write-Info "按 Enter 键停止服务"
    
    # 等待用户输入
    Read-Host
    
    # 停止作业
    Stop-Job $script:BACKEND_JOB
    Stop-Job $script:FRONTEND_JOB
    Remove-Job $script:BACKEND_JOB
    Remove-Job $script:FRONTEND_JOB
}

# 主函数
function Main {
    # 默认参数
    $script:CLEAN_MODE = $Clean
    
    # 解析参数
    if ($Help) {
        Show-Help
        exit 0
    }
    
    # 显示部署信息
    Write-Info "========================================"
    Write-Info "GushiinaBlog 开发环境启动"
    Write-Info "========================================"
    
    # 执行部署步骤
    Check-Environment
    Install-Dependencies
    Start-DevServices
    
    Write-Success "启动完成!"
}

# 运行主函数
Main
