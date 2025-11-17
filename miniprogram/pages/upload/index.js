const db = wx.cloud.database()

Page({
  data: {
    fileList: [],  // 文件列表
    uploadList: [],
    totalProgress: 0,
    isUploading: false
  },

  onLoad() {
    // this.loadFiles()
  },

  // 选择文件上传
  chooseFile() {
    wx.chooseMessageFile({
      count: 9,
      type: 'file',
      success: res => {
        const files = res.tempFiles
        if (!files || files.length === 0) return
  
        // 初始化 uploadList
        const uploadList = files.map(f => ({
          name: f.name,
          path: f.path,
          progress: 0,
          size: f.size,//加了文件大小
          status: '等待上传',
          msg: ''
        }))
        // this.setData({ uploadList })
        this.setData({ uploadList, isUploading: true})
        let completedCount = 0
        const successFiles = []
        const failFiles = []
  
        files.forEach((file, index) => {
          const uploadTask = wx.cloud.uploadFile({
            cloudPath: `tmp/${Date.now()}_${file.name}`,
            filePath: file.path,
            success: uploadRes => {
              wx.cloud.callFunction({
                name: 'uploadPDF',
                data: { fileID: uploadRes.fileID, name: file.name },
                success: cfRes => {
                  const uploadListCopy = this.data.uploadList
                  if (cfRes.result && cfRes.result.success) {
                    uploadListCopy[index].status = '成功'
                    uploadListCopy[index].progress = 100
                    successFiles.push(file.name)
                  } else {
                    uploadListCopy[index].status = '失败'
                    uploadListCopy[index].msg = cfRes.result.msg || '处理失败'
                    uploadListCopy[index].progress = 0
                    failFiles.push(file.name)
                  }
                  this.setData({ uploadList: uploadListCopy })
                },
                fail: err => {
                  const uploadListCopy = this.data.uploadList
                  uploadListCopy[index].status = '失败'
                  uploadListCopy[index].msg = err.message
                  uploadListCopy[index].progress = 0
                  failFiles.push(file.name)
                  this.setData({ uploadList: uploadListCopy })
                  completedCount++
                  this.updateOverallProgress()

                },
                complete: () => {
                  completedCount++
                  this.updateOverallProgress()
                  if (completedCount === files.length) {
                    // 所有文件上传完成，弹窗提示
                    let msg = ''
                    if (successFiles.length > 0) msg += `成功：${successFiles.join('、')}\n`
                    if (failFiles.length > 0) msg += `失败：${failFiles.join('、')}`
                    wx.showModal({
                      title: '上传结果',
                      content: msg,
                      showCancel: false
                    })
                    this.setData({ isUploading: false }) 
                    // this.loadFiles() // 刷新列表
                  }
                }
              })
            },
            fail: err => {
              const uploadListCopy = this.data.uploadList
              uploadListCopy[index].status = '失败'
              uploadListCopy[index].msg = err.message
              uploadListCopy[index].progress = 0
              failFiles.push(file.name)
              this.setData({ uploadList: uploadListCopy })
              completedCount++
              this.updateOverallProgress()
              if (completedCount === files.length) {
                let msg = ''
                if (successFiles.length > 0) msg += `成功：${successFiles.join('、')}\n`
                if (failFiles.length > 0) msg += `失败：${failFiles.join('、')}`
                wx.showModal({ title: '上传结果', content: msg, showCancel: false })
                
                // this.loadFiles()
              }
            }
          })
  
          uploadTask.onProgressUpdate(res => {
            const uploadListCopy = this.data.uploadList
            uploadListCopy[index].progress = res.progress
            // uploadListCopy[index].status = '上传中'
            uploadListCopy[index].status = res.progress === 100 ? '成功' : '上传中'
            this.setData({ uploadList: uploadListCopy })
            this.updateOverallProgress()
          })
        })
      }
    })
  },
  updateOverallProgress() {
    const uploadList = this.data.uploadList
    if (!uploadList || uploadList.length === 0) return
    const totalProgress = uploadList.reduce((sum, f) => sum + f.progress, 0) / uploadList.length
    this.setData({ totalProgress: Math.floor(totalProgress) })
  },
})
