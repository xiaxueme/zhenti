Page({
  data: {
    questions: [
      { type: 'single', title: '下面哪个是 JavaScript 的数据类型？', options: ['String', 'HTTP', 'CSS', 'HTML'], answer: 0 },
      { type: 'multiple', title: '下列哪些是前端框架？', options: ['React', 'Express', 'Vue', 'Django'], answer: [0,2] },
      { type: 'judgment', title: 'HTML 是一种编程语言。', answer: false },
      { type: 'text', title: '简述 MVC 模式。', answer: '' }
    ],
    currentIndex: 0,
    selected: null,
  submitAnswer() {
    selectedMultiple: [],
    answerText: '',
    statusText: '',
    answers: {},
    results: {},
    progressPercent: 0
  },
  onLoad() {
    // 尝试从云数据库加载题目，若失败使用内置示例
    if (wx.cloud) {
      try {
        const db = wx.cloud.database()
        db.collection('questions').get()
          .then(res => {
            if (res && res.data && res.data.length) {
              // 规范化云端题目格式
              const qs = res.data.map(item => {
                const q = Object.assign({}, item)
                q.type = q.type || 'single'
                q.title = q.title || (q.type + '：无标题')
                q.options = Array.isArray(q.options) ? q.options : []
                // 保证 answer 格式
                if (q.type === 'single') q.answer = (typeof q.answer === 'number') ? q.answer : Number(q.answer) || 0
                if (q.type === 'multiple') q.answer = Array.isArray(q.answer) ? q.answer.map(Number) : []
                if (q.type === 'judgment') q.answer = (q.answer === true || q.answer === 'true')
                if (q.type === 'text') q.answer = q.answer || ''
                return q
              })
              this.setData({ questions: qs }, this.updateCurrent)
              return
            }
            this.updateCurrent()
          })
          .catch(err => {
            console.error('从云加载题目失败', err)
            const msg = (err && err.message) ? err.message : JSON.stringify(err)
            wx.showToast({ title: '加载题库失败: ' + (msg.length>50?msg.slice(0,50)+'...':msg), icon: 'none', duration: 4000 })
            this.setData({ statusText: '加载题库失败，请检查云环境与权限' })
            this.updateCurrent()
          })
      } catch (e) {
        console.error('从云加载题目异常', e)
        wx.showToast({ title: '加载题库异常，请查看控制台', icon: 'none', duration: 4000 })
        this.setData({ statusText: '加载题库异常' })
        this.updateCurrent()
      }
    } else {
      wx.showToast({ title: '未启用云能力，使用本地示例', icon: 'none', duration: 2000 })
      this.setData({ statusText: '未启用云能力，使用本地示例' })
      this.updateCurrent()
    }
  },
  updateCurrent() {
    const current = this.data.questions[this.data.currentIndex]
    const percent = Math.round((Object.keys(this.data.answers).length / this.data.questions.length) * 100)
    this.setData({ current, statusText: '', progressPercent: percent || 0 })
  },
  onSelect(e) {
    const val = e.detail.value
    this.setData({ selected: val, statusText: '已选择' })
  },
  onMultipleChange(e) {
    const vals = e.detail.value.map(v => Number(v))
    this.setData({ selectedMultiple: vals, statusText: '已选择' })
  },
  onInput(e) {
    this.setData({ answerText: e.detail.value })
  },
  prev() {
    if (this.data.currentIndex > 0) {
      this.setData({ currentIndex: this.data.currentIndex - 1, selected: null, selectedMultiple: [], answerText: '' }, this.updateCurrent)
    }
  },
  next() {
    // 这里可加入判分逻辑，当前仅记录并跳转
    if (this.data.currentIndex < this.data.questions.length - 1) {
      this.setData({ currentIndex: this.data.currentIndex + 1, selected: null, selectedMultiple: [], answerText: '' }, this.updateCurrent)
    } else {
      this.setData({ statusText: '已完成所有示例题' })
    }
  }

  submitAnswer() {
    const i = this.data.currentIndex
    const q = this.data.questions[i]
    let userAns = null
    if (q.type === 'single' || q.type === 'judgment') {
      userAns = this.data.selected
    } else if (q.type === 'multiple') {
      userAns = this.data.selectedMultiple
    } else if (q.type === 'text') {
      userAns = this.data.answerText
    }
    const answers = this.data.answers || {}
    const results = this.data.results || {}
    answers[i] = userAns

    // 立即判题（简答题不判）
    if (q.type === 'single') {
      results[i] = (Number(userAns) === q.answer)
    } else if (q.type === 'multiple') {
      const a = Array.isArray(q.answer) ? q.answer.slice().sort().join(',') : ''
      const u = Array.isArray(userAns) ? userAns.slice().sort().join(',') : ''
      results[i] = (a === u)
    } else if (q.type === 'judgment') {
      const boolUser = (userAns === 'true' || userAns === true)
      results[i] = (boolUser === q.answer)
    } else if (q.type === 'text') {
      results[i] = null
    }

    const percent = Math.round((Object.keys(answers).length / this.data.questions.length) * 100)
    this.setData({ answers, results, statusText: '已保存本题答案', progressPercent: percent || 0 })
  },

  finishQuiz() {
    // 简单评分逻辑
    const answers = this.data.answers || {}
    let total = this.data.questions.length
    let score = 0
    this.data.questions.forEach((q, idx) => {
      const user = answers[idx]
      if (q.type === 'single') {
        if (Number(user) === q.answer) score += 1
      } else if (q.type === 'multiple') {
        const a = Array.isArray(q.answer) ? q.answer.sort().join(',') : ''
        const u = Array.isArray(user) ? user.sort().join(',') : ''
        if (a === u) score += 1
      } else if (q.type === 'judgment') {
        if ((user === 'true' || user === true) && q.answer === true) score += 1
        if ((user === 'false' || user === false) && q.answer === false) score += 1
      } else if (q.type === 'text') {
        if (user && user.trim().length > 0) score += 0 // 简答题不计分，仅记录
      }
    })
    const resultText = `评分完成：${score}/${total}`
    this.setData({ statusText: resultText })
    wx.showModal({ title: '测验结果', content: resultText, showCancel: false })
  }
})
