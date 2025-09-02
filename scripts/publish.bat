@echo off
REM Docker镜像发布脚本 (Windows版本)
REM 使用方法: scripts\publish.bat [version]

setlocal enabledelayedexpansion

REM 配置
set IMAGE_NAME=rd213/bibi-library
set DEFAULT_VERSION=latest

REM 获取版本号
if "%~1"=="" (
    set VERSION=%DEFAULT_VERSION%
) else (
    set VERSION=%~1
)

echo 🚀 开始构建和发布 Docker 镜像...
echo 📦 镜像名称: %IMAGE_NAME%
echo 🏷️  版本标签: %VERSION%

REM 检查Docker是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker 未运行，请启动 Docker
    exit /b 1
)

REM 构建镜像
echo 🔨 构建 Docker 镜像...
docker build -t %IMAGE_NAME%:%VERSION% .

if errorlevel 1 (
    echo ❌ 镜像构建失败
    exit /b 1
) else (
    echo ✅ 镜像构建成功
)

REM 如果指定了版本号，同时更新latest标签
if not "%VERSION%"=="%DEFAULT_VERSION%" (
    echo 🏷️  添加 latest 标签...
    docker tag %IMAGE_NAME%:%VERSION% %IMAGE_NAME%:latest
)

REM 推送到Docker Hub
echo 📤 推送到 Docker Hub...
docker push %IMAGE_NAME%:%VERSION%

if not "%VERSION%"=="%DEFAULT_VERSION%" (
    docker push %IMAGE_NAME%:latest
)

echo 🎉 发布完成！
echo 📋 镜像信息:
echo    - %IMAGE_NAME%:%VERSION%
if not "%VERSION%"=="%DEFAULT_VERSION%" (
    echo    - %IMAGE_NAME%:latest
)

echo.
echo 🔍 查看镜像: https://hub.docker.com/r/rd213/bibi-library

pause
