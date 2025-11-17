// 云函数入口文件
const cloud = require('wx-server-sdk')
const crypto = require('crypto') 

// 🟢 只修改这里：增加超时时间
cloud.init({ 
  env: cloud.DYNAMIC_CURRENT_ENV,
  timeout: 60000  // 60秒超时
})
const db = cloud.database()

exports.main = async (event) => {
  const { fileID, name} = event 
  if (!fileID || !name ) {
    return { success: false, msg: "缺少 fileID 或 name", tempURL: "" }
  }
  
  try {
    // 1️⃣ 下载文件
    const downloadRes = await cloud.downloadFile({ fileID })
    const buffer = downloadRes.fileContent
    const realSize = buffer.length 
    
    // 2️⃣ 计算 md5
    const md5 = crypto.createHash('md5').update(buffer).digest('hex')

    // 3️⃣ 查重
    const checkRes = await db.collection('pdfFiles').where({ md5 }).get()
    if (checkRes.data.length > 0) {
      return { success: false, msg: "该文件已上传", file: checkRes.data[0] }
    }

    // 4️⃣ 数字文件名
    const randomNum = Date.now() + "" + Math.floor(Math.random() * 1000)
    const ext = name.split('.').pop()
    const newFileName = `${randomNum}.${ext}`

    // 5️⃣ 上传（数字命名）
    const uploadRes = await cloud.uploadFile({
      cloudPath: `files/${newFileName}`,
      fileContent: buffer
    })
    
    // 6️⃣ 写入数据库
    const dbRes = await db.collection('pdfFiles').add({
      data: {
        fileID: uploadRes.fileID,   
        size: realSize || 0, 
        md5,                      
        name,                     
        type:  name.split('.').pop(),
        downloadCount: 0,        
        createTime: db.serverDate()
      }
    })
    
    // 7️⃣ 生成临时下载链接
    const urlRes = await cloud.getTempFileURL({
      fileList: [uploadRes.fileID],
      maxAge: 7 * 24 * 60 * 60
    })
    
    return {
      success: true,
      _id: dbRes._id,                  
      showName: name,   
      realFileID: uploadRes.fileID, 
      tempURL: urlRes.fileList[0].tempFileURL
    }
  } catch (e) {
    console.error("云函数操作失败", e)
    return {
      success: false,
      msg: "操作失败",
      error: e,
      tempURL: ""
    }
  }
}