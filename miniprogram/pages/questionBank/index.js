Page({
  data: {
    examples: [
      { title: '单选：下面哪个是 JS 的数据类型？' },
      { title: '多选：下列哪些是前端框架？' },
      { title: '判断：HTML 是编程语言。' },
      { title: '简答：简述 MVC 模式。' }
    ],
    loading: false
  },

  onLoad() {
    // 通过云函数读取题库，避免客户端 DB 权限限制
    if (!wx.cloud) {
      this.setData({ loading: false })
      return
    }
    this.setData({ loading: true })
    wx.cloud.callFunction({ name: 'getQuestions' })
      .then(res => {
        const result = res && res.result
        if (result && result.success && Array.isArray(result.data) && result.data.length) {
          const items = result.data.map((item, idx) => ({
            title: item.title || (item.type + '：无标题'),
            _idx: idx
          }))
          this.setData({ examples: items })
        }
        this.setData({ loading: false })
      })
      .catch(err => {
        console.error('加载题库失败', err)
        wx.showToast({ title: '加载题库失败，使用本地示例', icon: 'none' })
        this.setData({ loading: false })
      })
  },

  goToPractice() {
    wx.navigateTo({ url: '/pages/practice/index' })
  },

  goToPracticeIndex(e) {
    const idx = e.currentTarget.dataset.index || 0
    wx.navigateTo({ url: '/pages/practice/index?start=' + idx })
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
