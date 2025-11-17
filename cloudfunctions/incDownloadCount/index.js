// 云函数：incDownloadCount
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { id } = event   // 数据库中文档的 _id
  if (!id) {
    return { success: false, msg: '缺少文件 id' }
  }

  try {
    await db.collection('pdfFiles').doc(id).update({
      data: {
        downloadCount: _.inc(1)   // ✅ 自增 1
      }
    })
    return { success: true }
  } catch (e) {
    console.error('incDownloadCount error', e)
    return { success: false, msg: '更新失败', error: e }
  }
}
