#!/bin/bash

# GushiinaBlog 开发环境启动脚本 (Linux/macOS)
# 使用方法: ./deploy.sh [选项]
# 选项:
#   -h, --help      显示帮助信息
#   -c, --clean     清理依赖并重新安装

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 错误处理
error_exit() {
    log_error "$1"
    exit 1
}

# 显示帮助
show_help() {
    cat << EOF
GushiinaBlog 开发环境启动脚本

使用方法: ./deploy.sh [选项]

选项:
    -h, --help      显示此帮助信息
    -c, --clean     清理依赖并重新安装

示例:
    ./deploy.sh              # 启动开发环境
    ./deploy.sh -c           # 清理依赖并重新安装

EOF
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查环境
check_environment() {
    log_info "检查系统环境..."
    
    # 检查操作系统
    OS="$(uname -s)"
    case "$OS" in
        Linux*)     PLATFORM='Linux';;
        Darwin*)    PLATFORM='macOS';;
        *)          PLATFORM='Unknown';;
    esac
    log_info "检测到操作系统: $PLATFORM"
    
    # 检查 Node.js
    if ! command_exists node; then
        error_exit "Node.js 未安装，请先安装 Node.js >= 20"
    else
        NODE_VERSION=$(node --version)
        log_success "Node.js 已安装: $NODE_VERSION"
        
        # 检查版本是否 >= 20
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -lt 20 ]; then
            log_warn "Node.js 版本过低 (需要 >= 20)，建议升级"
        fi
    fi
    
    # 检查 npm
    if ! command_exists npm; then
        error_exit "npm 未安装，请安装 Node.js"
    else
        NPM_VERSION=$(npm --version)
        log_success "npm 已安装: $NPM_VERSION"
    fi
}

# 安装依赖
install_dependencies() {
    log_info "安装后端依赖..."
    cd DailyBlog/backend
    
    if [ "$CLEAN_MODE" == "true" ]; then
        log_info "清理现有依赖..."
        rm -rf node_modules package-lock.json
    fi
    
    npm install
    log_success "后端依赖安装完成"
    
    log_info "安装前端依赖..."
    cd ../frontend
    
    if [ "$CLEAN_MODE" == "true" ]; then
        log_info "清理现有依赖..."
        rm -rf node_modules package-lock.json
    fi
    
    npm install
    log_success "前端依赖安装完成"
    
    cd ../..
}

# 启动开发服务
start_dev_services() {
    log_info "启动开发环境..."
    
    # 启动后端
    cd DailyBlog/backend
    npm run dev &
    BACKEND_PID=$!
    log_info "后端服务已启动 (PID: $BACKEND_PID)"
    
    # 启动前端
    cd ../frontend
    npm run dev &
    FRONTEND_PID=$!
    log_info "前端服务已启动 (PID: $FRONTEND_PID)"
    
    cd ../..
    
    log_success "开发环境已启动!"
    log_info "后端: http://localhost:3001"
    log_info "前端: http://localhost:3000"
    log_info ""
    log_info "按 Ctrl+C 停止服务"
    
    # 等待用户按 Ctrl+C
    wait
}

# 主函数
main() {
    # 默认参数
    CLEAN_MODE="false"
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--clean)
                CLEAN_MODE="true"
                shift
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 显示部署信息
    log_info "========================================"
    log_info "GushiinaBlog 开发环境启动"
    log_info "========================================"
    
    # 执行部署步骤
    check_environment
    install_dependencies
    start_dev_services
    
    log_success "启动完成!"
}

# 运行主函数
main "$@"
