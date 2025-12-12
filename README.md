# 项目说明  公众号排版资源小程序
本仓库是一个基于微信小程序 + 云开发（Cloud Functions / 存储）的示例项目，

# 前端
- 首页是用于收集公众号排版作品表单、提交表单可以传到云服务器的云数据库，云数据库名称是forms
- 首页有一个点击查看所有的文件列表按钮，该按钮跳转到download/index页面
- download：文件列表页面，点击文件列表里面的每个文件查看按钮跳转到文件详情页面
- fileDetail：文件详情页面，点击下载并打开文件即可打开文件，免责声明按钮是跳转到免责声明页面
- mianze：免责声明页面
- upload：文件上传页面，点击上传文件，可以上传电脑本地任何文件到云服务器，数据库是pdfFiles

# 云服务器：
- 环境名称：cloud1
- 环境ID：git@github.com:xiaxueme/thinking-map.git 

- 线上giuhub项目仓库地址：
- https://github.com/xiaxueme/zhenti
- git@github.com:xiaxueme/zhenti.git 

## 功能
- 首页表单提交：用户可提交作品链接、邮箱、所在城市、职业、期望费用。
- 文件列表：download文件夹，在小程序内查看并下载所有可用资源（含下载计数统计）。
- 文件详情页：fileDetail文件夹，文件详情页面，点击下载并打开文件即可打开文件，免责声明按钮是跳转到免责声明页面。
- 上传文件：upload文件夹，文件上传页面，点击上传文件，可以上传电脑本地任何文件到云服务器，数据库是pdfFiles
- 免责声明：mianze文件夹，免责声明页面
- 下载统计功能：通过云函数记录并增长文件下载次数。
- 广告位展示功能：页面中嵌入了广告组件以便商业化展示。

## 仓库结构
- miniprogram/: 小程序前端代码（页面、组件、样式、配置）。
  - pages/index/: 首页表单（index.wxml、index.js 、index.wxss、index.json）。
  - pages/download/: 文件列表页面（index.wxml、index.js 、index.wxss、index.json）。
  - pages/fileDetail/：文件详情页面（index.wxml、index.js 、index.wxss、index.json）。
  - pages/upload/：文件上传页面（index.wxml、index.js 、index.wxss、index.json）。
  - pages/mianze/：免责声明页面（index.wxml、index.js 、index.wxss、index.json）。
  - envList.js：云环境配置文件。
- cloudfunctions/: 云函数目录
  - uploadPDF/: 处理 PDF 上传的云函数。
  - incDownloadCount/: 更新下载计数的云函数。
  - quickstartFunctions/: 示例/模板函数。
- uploadCloudFunction.sh：用于批量上传/部署云函数的脚本（在 Windows 上建议使用 Git Bash 或 WSL，或转换为 PowerShell）。
- project.config.json、project.private.config.json：微信开发者工具工程配置。

## 本地运行与调试（简要）
1. 安装并打开「微信开发者工具」。
2. 导入项目根目录（选择包含 miniprogram 的工程根）。
3. 在 miniprogram/envList.js 中确认云环境 env 与微信云控制台一致。
4. 在微信开发者工具中使用云开发面板部署云函数，或运行仓库内的 uploadCloudFunction.sh（Linux/macOS/Git Bash）来上传函数。
   - 在 Windows 原生 PowerShell 下该脚本可能需要调整；如需我可以帮你转换为 PowerShell 版本。
5. 在工具中启动调试，使用模拟器检查页面交互、表单提交与文件下载功能。

## 云函数与部署
- 建议先在微信云控制台创建相应的环境与存储空间，并确认权限配置。
- 可通过微信开发者工具逐一部署 cloudfunctions/ 下的函数；成功部署后小程序前端将能调用这些函数实现上传和计数。

## 隐私与使用说明
- 表单中收集的邮箱、链接等信息仅用于项目所述用途（例如排版招聘/联系），请在生产环境中补充严格的隐私策略与数据存储策略。

## 我可以帮你的事（可选）
- 把 uploadCloudFunction.sh 转为 Windows PowerShell 脚本并演示部署步骤。
- 审查并补充前端表单校验与后端输入校验。
- 为 README 增加更详细的页面流程图或截图。

---

如果你想，我现在可以把 uploadCloudFunction.sh 转为 PowerShell、或进一步补充具体的部署命令与示例。
