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
  }
})
