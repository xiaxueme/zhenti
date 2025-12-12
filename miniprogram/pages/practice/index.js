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
})
