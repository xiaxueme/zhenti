const db = wx.cloud.database()
const forms = db.collection("forms")

// 是否启用广告（调试阶段可设置 false）
const USE_AD = true  

Page({
  data: {
    logs: [],
    jobOptions: ["学生", "已工作"],
    jobIndex: 0,
    noContactStart: "",
    noContactEnd: "",
    isSubmitting: false  // 防止重复提交
  },

  // 日志记录
  log(msg) {
    this.setData({
      logs: [...this.data.logs, msg]
    })
    console.log(this.data.logs)
  },

  // 职业切换
  setJob(e) {
    const job = e.currentTarget.dataset.job
    this.setData({
      jobIndex: this.data.jobOptions.indexOf(job)
    })
  },

  // 时间选择
  onStartTimeChange(e) { this.setData({ noContactStart: e.detail.value }) },
  onEndTimeChange(e) { this.setData({ noContactEnd: e.detail.value }) },

  // 表单验证
  validateForm(data) {
    if (!data.link.trim()) return "作品链接不能为空"
    if (!data.mail.trim()) return "邮箱不能为空"
    if (!data.city.trim()) return "地方不能为空"
    if (!data.feiyong.trim()) return "期望费用不能为空"
    if (isNaN(Number(data.feiyong))) return "期望费用必须是数字"
    return null
  },

  // 点击提交按钮
  onSubmit(e) {
    if (this.data.isSubmitting) return

    const formData = e.detail.value
    formData.job = this.data.jobOptions[this.data.jobIndex]
    // formData.noContactStart = this.data.noContactStart
    // formData.noContactEnd = this.data.noContactEnd
    formData.created = new Date()

    const error = this.validateForm(formData)
    if (error) {
      wx.showToast({ title: error, icon: "none", duration: 2000 })
      return
    }

    // 提示用户是否观看广告
    wx.showModal({
      title: '提示',
      content: '提交应聘需要观看完广告，是否继续？',
      confirmText: '继续',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户选择继续
          this.setData({ isSubmitting: true })
          this.triggerAdAndSubmit(formData)
        } else {
          wx.showToast({ title: '已取消提交', icon: 'none', duration: 1500 })
        }
      }
    })
  },
   // 广告逻辑封装
   triggerAdAndSubmit(formData) {
    if (USE_AD && wx.createRewardedVideoAd) {
      if (!this.videoAd) {
        // 创建单例广告
        this.videoAd = wx.createRewardedVideoAd({ adUnitId: 'adunit-d17a9389a474cd00' })
        this.videoAd.onClose(res => {
          if (res && res.isEnded) {
            this.submitForm(formData)
          } else {
            wx.showToast({ title: '看完广告才能提交', icon: 'none', duration: 2000 })
            this.setData({ isSubmitting: false })
          }
        })
        this.videoAd.onError(err => {
          console.error('广告错误', err)
          wx.showToast({ title: '广告异常，无法提交', icon: 'none', duration: 2000 })
          this.setData({ isSubmitting: false })
        })
      }

      this.videoAd.load()
        .then(() => this.videoAd.show())
        .catch(err => {
          console.error('广告加载失败', err)
          wx.showToast({ title: '广告加载失败，无法提交', icon: 'none', duration: 2000 })
          this.setData({ isSubmitting: false })
        })

    } else {
      // 调试或不支持广告环境直接提交
      wx.showToast({ title: '未启用广告，直接提交', icon: 'none', duration: 1000 })
      this.submitForm(formData)
    }
  },
submit2(e) {
    // 提示用户是否观看广告
    wx.showToast({ title: "轻点左边的绿色提交按钮", icon: "none", duration: 4000 })
  },
  // 真正提交表单
  submitForm(formData) {
    forms.add({ data: formData })
      .then(res => {
        this.log("提交成功: " + JSON.stringify(res))
        wx.showToast({ title: "提交成功，静待佳音", icon: "success", duration: 2000 })

        this.setData({ 
          noContactStart: "", 
          noContactEnd: "", 
          jobIndex: 0, 
          isSubmitting: false 
        })

        const formComponent = this.selectComponent('form')
        if (formComponent?.reset) formComponent.reset()
      })
      .catch(err => {
        this.log("提交失败: " + JSON.stringify(err))
        wx.showToast({ title: "提交失败", icon: "none", duration: 2000 })
        this.setData({ isSubmitting: false })
      })
  },
  goToDownload() {
    wx.navigateTo({
      url: '/pages/download/index', // 跳转到下载页
    })
  }

  ,goToQuestionBank() {
    wx.navigateTo({ url: '/pages/questionBank/index' })
  }
})
