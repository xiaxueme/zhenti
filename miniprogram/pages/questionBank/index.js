Page({
  data: {
    examples: [
      { title: '单选：下面哪个是 JS 的数据类型？' },
      { title: '多选：下列哪些是前端框架？' },
      { title: '判断：HTML 是编程语言。' },
      { title: '简答：简述 MVC 模式。' }
    ]
  },
  goToPractice() {
    wx.navigateTo({ url: '/pages/practice/index' })
  },

  uploadSamples() {
    // 使用云开发写入示例题到 questions 集合
    if (!wx.cloud) {
      wx.showToast({ title: '未配置云环境，无法上传', icon: 'none' })
      return
    }
    const db = wx.cloud.database()
    const questions = db.collection('questions')
    const samples = [
      { type: 'single', title: '下面哪个是 JavaScript 的数据类型？', options: ['String','HTTP','CSS','HTML'], answer: 0 },
      { type: 'multiple', title: '下列哪些是前端框架？', options: ['React','Express','Vue','Django'], answer: [0,2] },
      { type: 'judgment', title: 'HTML 是一种编程语言。', answer: false },
      { type: 'text', title: '简述 MVC 模式。', answer: '' }
    ]
    wx.showLoading({ title: '上传中...' })
    const ops = samples.map(s => questions.add({ data: s }))
    Promise.all(ops)
      .then(() => {
        wx.hideLoading()
        wx.showToast({ title: '示例题上传成功', icon: 'success' })
      })
      .catch(err => {
        wx.hideLoading()
        wx.showToast({ title: '上传失败，请检查云配置', icon: 'none' })
        console.error(err)
      })
  }
})
