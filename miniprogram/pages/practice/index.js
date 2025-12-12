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
    statusText: ''
  },
  onLoad() {
    this.updateCurrent()
  },
  updateCurrent() {
    const current = this.data.questions[this.data.currentIndex]
    this.setData({ current, statusText: '' })
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
    answers[i] = userAns
    this.setData({ answers, statusText: '已保存本题答案' })
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
    this.setData({ statusText: `评分完成：${score}/${total}` })
  }
})
