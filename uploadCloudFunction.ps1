param(
    [string]$installPath = $env:installPath,
    [string]$envId = $env:envId,
    [string]$projectPath = $env:projectPath
)

if (-not $installPath) {
    Write-Error "参数或环境变量 'installPath' 未提供。示例： -installPath 'wx' 或设置环境变量 installPath。"
    exit 1
}

if (-not $envId) {
    Write-Error "参数或环境变量 'envId' 未提供。示例： -envId 'cloud1' 或设置环境变量 envId。"
    exit 1
}

if (-not $projectPath) {
    Write-Error "参数或环境变量 'projectPath' 未提供。示例： -projectPath 'e:\\zhenti' 或设置环境变量 projectPath。"
    exit 1
}

$args = @(
    'cloud', 'functions', 'deploy',
    '--e', $envId,
    '--n', 'quickstartFunctions',
    '--r',
    '--project', $projectPath
)

Write-Output "执行命令： $installPath $($args -join ' ')"

& $installPath @args
$rc = $LASTEXITCODE
if ($rc -ne 0) {
    Write-Error "云函数部署失败，退出码： $rc"
    exit $rc
}

Write-Output "云函数部署完成。"
