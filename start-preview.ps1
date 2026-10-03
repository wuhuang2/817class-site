# 本地预览启动脚本
#
# 说明：本机没有系统级 Node/npm，Hexo 工具链来自 DSH 内置目录。
# 用法：右键本文件 -> "使用 PowerShell 运行"，或在 PowerShell 中执行 .\start-preview.ps1

$ErrorActionPreference = 'Stop'
$pnpm = "C:\Users\lenovo\AppData\Roaming\dsh-desktop\harness\.desktop-bin\pnpm.cmd"
$proj = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Test-Path $pnpm)) {
    Write-Host "找不到 pnpm: $pnpm" -ForegroundColor Red
    Write-Host "请确认 DSH Desktop 的安装位置是否变化。" -ForegroundColor Yellow
    exit 1
}

Set-Location $proj

Write-Host ""
Write-Host "请选择预览模式：" -ForegroundColor Cyan
Write-Host "  1) Hexo 开发服务器  —— 改文件自动刷新（推荐日常使用）"
Write-Host "  2) 静态服务器       —— 能真实测试 404 页面（模拟生产环境）"
Write-Host ""
$choice = Read-Host "输入 1 或 2（回车默认 1）"
if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }

if ($choice -eq "2") {
    if (-not (Test-Path (Join-Path $proj "public\index.html"))) {
        Write-Host "`n首次运行，正在构建..." -ForegroundColor Yellow
        & $pnpm exec hexo generate
    }
    Write-Host "`n启动静态服务器（端口 4400）..." -ForegroundColor Green
    Write-Host "  首页:     http://localhost:4400/" -ForegroundColor Green
    Write-Host "  404 测试: http://localhost:4400/does-not-exist" -ForegroundColor Green
    Write-Host ""
    node (Join-Path $proj "serve-404.js") 4400
} else {
    Write-Host "`n启动 Hexo 开发服务器（端口 4321）..." -ForegroundColor Green
    Write-Host "  访问: http://localhost:4321/" -ForegroundColor Green
    Write-Host "  注意: hexo server 对未知路径只返回纯文本 'Cannot GET'，" -ForegroundColor Yellow
    Write-Host "        要测试 404 页面请改用模式 2。" -ForegroundColor Yellow
    Write-Host ""
    & $pnpm exec hexo server -p 4321
}
