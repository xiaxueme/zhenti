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
    selectedMultiple: [],
    answerText: '',
    statusText: '',
    answers: {},
    results: {},
    progressPercent: 0,
    current: null
  },
  onLoad(options) {
    // 支持从列表传入起始题目索引
    console.log('practice onLoad options:', options)
    this.setData({ statusText: '准备加载题目...' })
    if (options && options.start) {
      const start = Number(options.start) || 0
      this.setData({ currentIndex: start })
    }
    // 使用云函数读取题库（云函数以服务端权限访问 DB，避免客户端权限限制）
    if (wx.cloud) {
      wx.cloud.callFunction({ name: 'getQuestions' })
        .then(res => {
          console.log('getQuestions raw res:', res)
          const result = res && res.result
          if (result && result.success && Array.isArray(result.data) && result.data.length) {
            const qs = result.data.map(item => {
              const q = Object.assign({}, item)
              q.type = q.type || 'single'
              q.title = q.title || (q.type + '：无标题')
              q.options = Array.isArray(q.options) ? q.options : []
              if (q.type === 'single') q.answer = (typeof q.answer === 'number') ? q.answer : Number(q.answer) || 0
              if (q.type === 'multiple') q.answer = Array.isArray(q.answer) ? q.answer.map(Number) : []
              if (q.type === 'judgment') q.answer = (q.answer === true || q.answer === 'true')
              if (q.type === 'text') q.answer = q.answer || ''
              return q
            })
              this.setData({ questions: qs, statusText: `加载到 ${qs.length} 道题` }, () => {
                // 加载本地缓存答案（如果有）
                try {
                  const answers = this.data.answers || {}
                  const results = this.data.results || {}
                  qs.forEach((q, idx) => {
                    const qKey = q._id ? `practice_q_${q._id}` : `practice_idx_${idx}`
                    const stored = wx.getStorageSync(qKey)
                    if (stored && stored.answer !== undefined) {
                      answers[idx] = stored.answer
                      // 立即判题（简答题不判）
                      if (q.type === 'single') results[idx] = (Number(stored.answer) === q.answer)
                      else if (q.type === 'multiple') {
                        const a = Array.isArray(q.answer) ? q.answer.slice().sort().join(',') : ''
                        const u = Array.isArray(stored.answer) ? stored.answer.slice().sort().join(',') : ''
                        results[idx] = (a === u)
                      } else if (q.type === 'judgment') results[idx] = (stored.answer === 'true' || stored.answer === true) === q.answer
                    }
                  })
                  this.setData({ answers, results })
                } catch (e) { console.warn('load cache fail', e) }
                this.updateCurrent()
              })
            return
          }
          this.setData({ statusText: '未读取到云题目，使用本地示例' })
          this.updateCurrent()
        })
        .catch(err => {
          console.error('调用云函数 getQuestions 失败', err)
          const msg = (err && err.message) ? err.message : JSON.stringify(err)
          wx.showToast({ title: '加载题库失败: ' + (msg.length>50?msg.slice(0,50)+'...':msg), icon: 'none', duration: 4000 })
          this.setData({ statusText: '加载题库失败，请检查云环境与函数部署' })
          this.updateCurrent()
        })
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
  },

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
    // 本地缓存（按题目 id 或索引）
    const qKey = q._id ? `practice_q_${q._id}` : `practice_idx_${i}`
    try { wx.setStorageSync(qKey, { answer: userAns, ts: Date.now() }) } catch (e) { console.warn('storage fail', e) }

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
    // 显示结果并展示答案
    this.setData({ answers, results, statusText: '已保存本题答案', progressPercent: percent || 0 })
    // 将判题结果暴露在页面（results 已被赋值）
    this.setData({ results })
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
