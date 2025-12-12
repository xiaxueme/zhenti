const cloud = require('wx-server-sdk')

// 显式使用与小程序相同的环境 ID，避免环境不一致导致的读取失败
cloud.init({ env: 'cloud1-4gpyhtbn83d58529' })

const db = cloud.database()

module.exports.main = async (event, context) => {
  try {
    const res = await db.collection('questions').get()
    return { success: true, data: res.data || [] }
  } catch (err) {
    return { success: false, error: err }
  }
}
