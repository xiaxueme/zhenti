const db = wx.cloud.database()

Page({
  data: {
    file: {},         // 当前文件数据
    loading: true,
    tempURL: "",       // 临时 HTTPS 链接
    fileSizeText: ''
  },

  onLoad(options) {
    const id = options.id
    if (!id) {
      wx.showToast({ title: '缺少文件ID', icon: 'none' })
      this.setData({ loading: false })
      return
    }
    this.loadFile(id)
  },

  // 查询数据库中的文件信息
  loadFile(id) {
    db.collection('pdfFiles').doc(id).get()
      .then(res => {
        // this.setData({ file: res.data })
        this.setData({
          file: res.data, 
          fileSizeText: this.formatSize(res.data.size)
        })
        console.log(res.data)
        if (res.data.fileID) {
          this.getTempURL(res.data.fileID)
        } else {
          wx.showToast({ title: '文件ID不存在', icon: 'none' })
          this.setData({ loading: false })
        }
      })
      .catch(err => {
        wx.showToast({ title: '文件不存在', icon: 'none' })
        console.error(err)
        this.setData({ loading: false })
      })
  },
  // async loadFile(id) {
  //   try {
  //     // 查数据库
  //     const res = await db.collection('pdfFiles').doc(id).get()
  //     const file = res.data

  //     // 生成临时链接
  //     const urlRes = await cloud.getTempFileURL({
  //       fileList: [file.fileID],
  //       maxAge: 7 * 24 * 60 * 60
  //     })

  //     this.setData({
  //       file,
  //       tempURL: urlRes.fileList[0].tempFileURL
  //     })
  //   } catch (err) {
  //     console.error(err)
  //     wx.showToast({ title: '文件不存在', icon: 'none' })
  //   }
  // },
  // 获取临时 HTTPS 链接
  getTempURL(fileID) {
    wx.cloud.getTempFileURL({
      fileList: [fileID],
      success: res => {
        if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
          this.setData({ tempURL: res.fileList[0].tempFileURL, loading: false })
        } else {
          wx.showToast({ title: '文件链接获取失败', icon: 'none' })
          this.setData({ loading: false })
        }
      },
      fail: err => {
        console.error("获取临时链接失败", err)
        wx.showToast({ title: "文件加载失败", icon: "none" })
        this.setData({ loading: false })
      }
    })
  },

  // 下载并打开文件
  downloadFile() {
    const { tempURL, file } = this.data
    if (!tempURL) {
      wx.showToast({ title: '文件链接无效', icon: 'none' })
      return
    }
 // 1) 先让后端次数 +1（不阻塞后续操作，失败也不影响下载）
 const id = this.data.file && this.data.file._id
    wx.cloud.callFunction({
        name: 'incDownloadCount',
        data: { id }
    }).catch(err => {
        console.warn('下载次数+1失败（不影响使用）', err)
    })

    wx.showLoading({ title: '下载中...' })
    wx.downloadFile({
      url: tempURL,
      success: res => {
        wx.hideLoading()
        // wx.openDocument({
        //   filePath: res.tempFilePath,
        //   fileType: this.getFileType(file.name),
        //   showMenu: true,
        //   success: () => console.log('打开成功'),
        //   fail: err => {
        //     wx.showToast({ title: '文件无法打开', icon: 'none' })
        //     console.error(err)
        //   }
        // })
        
        // 获取系统信息来判断平台
        // 获取设备信息来判断平台
        // wx.getDeviceInfo({
        //   success: (deviceInfo) => {
        //     const isIOS = deviceInfo.platform === 'ios'
            
        //     // 根据平台选择不同的打开策略
        //     if (isIOS) {
        //       this.openDocumentForIOS(res.tempFilePath, file.name)
        //     } else {
        //       this.openDocumentForAndroid(res.tempFilePath, file.name)
        //     }
        //   },
        //   fail: () => {
        //     // 获取设备信息失败时，默认使用Android方式打开
        //     console.warn('获取设备信息失败，使用默认打开方式')
        //     this.openDocumentForAndroid(res.tempFilePath, file.name)
        //   }
        // })

        // 先尝试iOS方式打开（不指定fileType让系统自动识别）
        wx.openDocument({
          filePath: res.tempFilePath,
          showMenu: true,
          success: () => {
            console.log('文件打开成功')
          },
          fail: (err) => {
            console.log('自动识别失败，尝试指定类型:', err)
            // 如果自动识别失败，再尝试指定文件类型（iOS需要精确类型）
            wx.openDocument({
              filePath: res.tempFilePath,
              fileType: this.getFileTypeForIOS(file.name),
              showMenu: true,
              success: () => {
                console.log('指定类型打开成功')
              },
              fail: (err2) => {
                console.log('指定类型也失败，尝试通用类型:', err2)
                // 最后尝试使用通用类型（Android兼容方式）
                wx.openDocument({
                  filePath: res.tempFilePath,
                  fileType: this.getFileType(file.name),
                  showMenu: true,
                  success: () => {
                    console.log('通用类型打开成功')
                  },
                  fail: (err3) => {
                    console.error('所有方式都失败:', err3)
                    wx.showToast({ title: '文件无法打开', icon: 'none' })
                  }
                })
              }
            })
          }
        })

      },
      fail: err => {
        wx.hideLoading()
        wx.showToast({ title: '下载失败', icon: 'none' })
        console.error(err)
      }
    })
  },
// iOS平台的文件打开方式
openDocumentForIOS(filePath, fileName) {
  // iOS首先尝试不指定fileType，让系统自动识别
  wx.openDocument({
    filePath: filePath,
    showMenu: true,
    success: () => {
      console.log('iOS文件打开成功')
    },
    fail: (err) => {
      console.log('iOS自动识别失败，尝试指定类型:', err)
      // 如果自动识别失败，再尝试指定文件类型
      wx.openDocument({
        filePath: filePath,
        fileType: this.getFileTypeForIOS(fileName),
        showMenu: true,
        success: () => {
          console.log('iOS指定类型打开成功')
        },
        fail: (err2) => {
          console.error('iOS文件打开失败:', err2)
          wx.showToast({ title: '文件无法打开', icon: 'none' })
        }
      })
    }
  })
},
// Android平台的文件打开方式
openDocumentForAndroid(filePath, fileName) {
  wx.openDocument({
    filePath: filePath,
    fileType: this.getFileType(fileName),
    showMenu: true,
    success: () => {
      console.log('Android文件打开成功')
    },
    fail: err => {
      console.error('Android文件打开失败:', err)
      wx.showToast({ title: '文件无法打开', icon: 'none' })
    }
  })
},
// 针对iOS优化的文件类型判断方法
getFileTypeForIOS(fileName) {
  if (!fileName) return ''
  const ext = fileName.split('.').pop().toLowerCase()
  switch (ext) {
    case 'pdf': return 'pdf'
    case 'doc': return 'doc'
    case 'docx': return 'docx'  // iOS需要精确匹配docx
    case 'xls': return 'xls'
    case 'xlsx': return 'xlsx'  // iOS需要精确匹配xlsx
    case 'ppt': return 'ppt'
    case 'pptx': return 'pptx'  // iOS需要精确匹配pptx
    default: return ''
  }
},
  // 复制临时链接
  copyLink() {
    const { tempURL } = this.data
    if (!tempURL) {
      wx.showToast({ title: '无效的链接', icon: 'none' })
      return
    }
    wx.setClipboardData({
      data: tempURL,
      success: () => wx.showToast({ title: '已复制链接', icon: 'success' }),
      fail: err => console.error('复制失败', err)
    })
  },

  // 分享给好友
  onShareAppMessage() {
    const { file } = this.data
    return {
      title: file.name || '文件分享',
      path: `/pages/fileDetail/index?id=${file._id}`
    }
  },  
  // 分享到朋友圈
  onShareTimeline() {
    const { tempURL, file } = this.data
    return {
      title: file.name || '文件分享',
      query: `id=${file._id}&url=${encodeURIComponent(tempURL)}`
    }
  },

  // 根据文件名判断文件类型
  getFileType(fileName) {
    if (!fileName) return ''
    const ext = fileName.split('.').pop().toLowerCase()
    switch (ext) {
      case 'pdf': return 'pdf'
      case 'doc':
      case 'docx': return 'doc'
      case 'xls':
      case 'xlsx': return 'xls'
      case 'ppt':           // 🟡 新增
      case 'pptx': return 'ppt'  // 🟡 新增
      default: return ''
    }
  },
  //JS 里加一个格式化方法
  formatSize(size) {
    if (!size) return '未知'
    if (size < 1024) return size + ' B'
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
    return (size / (1024 * 1024)).toFixed(1) + ' MB'
  },
  goDisclaimer() {
    wx.navigateTo({
      url: '/pages/mianze/index'
    })
  }
})
