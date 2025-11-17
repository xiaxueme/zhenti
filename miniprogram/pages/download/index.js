const db = wx.cloud.database()

Page({
  data: {
    fileList: [],  // 文件列表
    uploadList: [],
    totalProgress: 0,
    isUploading: false
  },

  onLoad() {
    this.loadFiles()
  },

  // // 选择文件上传
  // chooseFile() {
  //   wx.chooseMessageFile({
  //     count: 9,
  //     type: 'file',
  //     success: res => {
  //       const files = res.tempFiles
  //       if (!files || files.length === 0) return
  
  //       // 初始化 uploadList
  //       const uploadList = files.map(f => ({
  //         name: f.name,
  //         path: f.path,
  //         progress: 0,
  //         status: '等待上传',
  //         msg: ''
  //       }))
  //       // this.setData({ uploadList })
  //       this.setData({ uploadList, isUploading: true})
  //       let completedCount = 0
  //       const successFiles = []
  //       const failFiles = []
  
  //       files.forEach((file, index) => {
  //         const uploadTask = wx.cloud.uploadFile({
  //           cloudPath: `tmp/${Date.now()}_${file.name}`,
  //           filePath: file.path,
  //           success: uploadRes => {
  //             wx.cloud.callFunction({
  //               name: 'uploadPDF',
  //               data: { fileID: uploadRes.fileID, name: file.name },
  //               success: cfRes => {
  //                 const uploadListCopy = this.data.uploadList
  //                 if (cfRes.result && cfRes.result.success) {
  //                   uploadListCopy[index].status = '成功'
  //                   uploadListCopy[index].progress = 100
  //                   successFiles.push(file.name)
  //                 } else {
  //                   uploadListCopy[index].status = '失败'
  //                   uploadListCopy[index].msg = cfRes.result.msg || '处理失败'
  //                   uploadListCopy[index].progress = 0
  //                   failFiles.push(file.name)
  //                 }
  //                 this.setData({ uploadList: uploadListCopy })
  //               },
  //               fail: err => {
  //                 const uploadListCopy = this.data.uploadList
  //                 uploadListCopy[index].status = '失败'
  //                 uploadListCopy[index].msg = err.message
  //                 uploadListCopy[index].progress = 0
  //                 failFiles.push(file.name)
  //                 this.setData({ uploadList: uploadListCopy })
  //                 completedCount++
  //                 this.updateOverallProgress()

  //               },
  //               complete: () => {
  //                 completedCount++
  //                 this.updateOverallProgress()
  //                 if (completedCount === files.length) {
  //                   // 所有文件上传完成，弹窗提示
  //                   let msg = ''
  //                   if (successFiles.length > 0) msg += `成功：${successFiles.join('、')}\n`
  //                   if (failFiles.length > 0) msg += `失败：${failFiles.join('、')}`
  //                   wx.showModal({
  //                     title: '上传结果',
  //                     content: msg,
  //                     showCancel: false
  //                   })
  //                   this.setData({ isUploading: false }) 
  //                   this.loadFiles() // 刷新列表
  //                 }
  //               }
  //             })
  //           },
  //           fail: err => {
  //             const uploadListCopy = this.data.uploadList
  //             uploadListCopy[index].status = '失败'
  //             uploadListCopy[index].msg = err.message
  //             uploadListCopy[index].progress = 0
  //             failFiles.push(file.name)
  //             this.setData({ uploadList: uploadListCopy })
  //             completedCount++
  //             this.updateOverallProgress()
  //             if (completedCount === files.length) {
  //               let msg = ''
  //               if (successFiles.length > 0) msg += `成功：${successFiles.join('、')}\n`
  //               if (failFiles.length > 0) msg += `失败：${failFiles.join('、')}`
  //               wx.showModal({ title: '上传结果', content: msg, showCancel: false })
                
  //               this.loadFiles()
  //             }
  //           }
  //         })
  
  //         uploadTask.onProgressUpdate(res => {
  //           const uploadListCopy = this.data.uploadList
  //           uploadListCopy[index].progress = res.progress
  //           // uploadListCopy[index].status = '上传中'
  //           uploadListCopy[index].status = res.progress === 100 ? '成功' : '上传中'
  //           this.setData({ uploadList: uploadListCopy })
  //           this.updateOverallProgress()
  //         })
  //       })
  //     }
  //   })
  // },
  // updateOverallProgress() {
  //   const uploadList = this.data.uploadList
  //   if (!uploadList || uploadList.length === 0) return
  //   const totalProgress = uploadList.reduce((sum, f) => sum + f.progress, 0) / uploadList.length
  //   this.setData({ totalProgress: Math.floor(totalProgress) })
  // },

  // 加载文件列表
  loadFiles() {
    db.collection('pdfFiles')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        console.log('查询结果', res.data)
        this.setData({ fileList: res.data })
      })
      .catch(err => console.error(err))
  },

  // 下载并打开文件（使用临时 HTTPS 链接）
  openFile(e) {
    const fileID = e.currentTarget.dataset.fileid
    const name = e.currentTarget.dataset.name

    if (!fileID) {
      wx.showToast({ title: '文件地址无效', icon: 'none' })
      return
    }

    wx.cloud.getTempFileURL({
      fileList: [fileID],
      success: res => {
        const tempURL = res.fileList[0].tempFileURL
        wx.downloadFile({
          url: tempURL,
          success: downloadRes => {
            wx.openDocument({
              filePath: downloadRes.tempFilePath,
              fileType: this.getFileType(name),
              showMenu: true,
              success: () => console.log('打开成功'),
              fail: err => wx.showToast({ title: '文件无法打开', icon: 'none' })
            })
          },
          fail: err => {
            wx.showToast({ title: '下载失败', icon: 'none' })
            console.error(err)
          }
        })
      },
      fail: err => {
        wx.showToast({ title: '获取文件失败', icon: 'none' })
        console.error(err)
      }
    })
  },

  // 复制临时链接
  copyLink(e) {
    const fileID = e.currentTarget.dataset.fileid
    if (!fileID) {
      wx.showToast({ title: '无效的链接', icon: 'none' })
      return
    }

    wx.cloud.getTempFileURL({
      fileList: [fileID],
      success: res => {
        const tempURL = res.fileList[0].tempFileURL
        wx.setClipboardData({
          data: tempURL,
          success: () => wx.showToast({ title: '已复制链接', icon: 'success' })
        })
      },
      fail: err => {
        wx.showToast({ title: '获取链接失败', icon: 'none' })
        console.error(err)
      }
    })
  },

  // 跳转到文件详情页
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/fileDetail/index?id=${id}`
    })
  },

  // 根据文件名判断文件类型
  getFileType(fileName) {
    if (!fileName) return ''
    const ext = fileName.split('.').pop().toLowerCase()
    if (ext === 'pdf') return 'pdf'
    if (ext === 'doc' || ext === 'docx') return 'doc'
    if (ext === 'xls' || ext === 'xlsx') return 'xls'
    return ''
  },

  // 分享给好友
  onShareAppMessage(e) {
    const item = e.target.dataset.item
    return {
      title: item.name || '文件分享',
      path: `/pages/fileDetail/index?id=${item._id}`
    }
  },

  // 分享到朋友圈
  onShareTimeline(e) {
    const item = e.target.dataset.item
    return {
      title: item.name || '文件分享',
      query: `id=${item._id}`
    }
  }
})
