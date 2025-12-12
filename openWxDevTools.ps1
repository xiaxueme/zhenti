<#
Opens the local WeChat Mini Program Developer Tools for a given project path.
Usage examples:
  .\openWxDevTools.ps1 -projectPath 'e:\zhenti'
  .\openWxDevTools.ps1 -exePath 'C:\Program Files (x86)\Tencent\微信web开发者工具\微信开发者工具.exe' -projectPath 'e:\zhenti'
#>
param(
    [string]$exePath = $null,
    [string]$projectPath = (Resolve-Path ".").Path
)

function Find-DefaultExe {
    $candidates = @(
        "$env:LOCALAPPDATA\Programs\微信web开发者工具\微信开发者工具.exe",
        "$env:ProgramFiles(x86)\Tencent\微信web开发者工具\微信开发者工具.exe",
        "$env:ProgramFiles\Tencent\微信web开发者工具\微信开发者工具.exe",
        "$env:ProgramFiles\微信web开发者工具\微信开发者工具.exe",
        "$env:ProgramFiles\wechatwebdevtools\wechatdevtools.exe",
        "C:\\Program Files (x86)\\Tencent\\WeChatDevTools\\WechatDevTools.exe"
    )
    foreach ($p in $candidates) {
        if ($p -and (Test-Path $p)) { return $p }
    }
    return $null
}

if (-not $exePath) {
    $exePath = Find-DefaultExe
}

if (-not $exePath -or -not (Test-Path $exePath)) {
    Write-Host "未找到微信开发者工具可执行文件。请手动提供参数 -exePath 指向可执行文件。"
    Write-Host "常见位置示例：C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\微信开发者工具.exe"
    exit 1
}

if (-not $projectPath) {
    Write-Host "未提供项目路径。使用当前目录作为项目路径。"
    $projectPath = (Resolve-Path ".").Path
}

Write-Host "使用可执行文件： $exePath"
Write-Host "打开项目： $projectPath"

# 尝试使用 --project 参数打开项目（多数版本支持），若不支持则直接启动可执行文件
$arg = "--project" + " `"$projectPath`""
try {
    Start-Process -FilePath $exePath -ArgumentList $arg -WorkingDirectory $projectPath -ErrorAction Stop
    Write-Host "已尝试以参数打开微信开发者工具（如果该版本支持命令行打开项目）。"
} catch {
    Write-Warning "以参数方式启动失败，改为直接启动可执行文件。 错误： $_"
    Start-Process -FilePath $exePath -WorkingDirectory $projectPath
    Write-Host "已启动微信开发者工具，请在工具中手动打开项目。"
}
