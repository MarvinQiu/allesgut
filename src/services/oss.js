// OSS配置和上传服务
import OSS from '@alicloud/oss-browser-sdk';

// 获取临时凭证的函数
const getOSSToken = async () => {
  // 实际项目中，这里需要从后端获取临时凭证
  // 这里仅作为示例，使用模拟数据
  return {
    accessKeyId: 'YOUR_TEMP_ACCESS_KEY_ID',
    accessKeySecret: 'YOUR_TEMP_ACCESS_KEY_SECRET',
    stsToken: 'YOUR_TEMP_STS_TOKEN',
    region: 'oss-cn-hangzhou',
    bucket: 'your-bucket-name'
  };
};

// 生成唯一的文件名
const generateUniqueFileName = (file) => {
  const ext = file.name.split('.').pop();
  return `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
};

// 上传单个文件到OSS
const uploadFile = async (file, ossClient) => {
  try {
    const fileName = generateUniqueFileName(file);
    const result = await ossClient.put(`/uploads/${fileName}`, file);
    return result.url;
  } catch (error) {
    console.error('上传文件失败:', error);
    throw error;
  }
};

// 上传多个文件到OSS
export const uploadToOSS = async (files) => {
  try {
    const ossConfig = await getOSSToken();
    const client = new OSS({
      region: ossConfig.region,
      accessKeyId: ossConfig.accessKeyId,
      accessKeySecret: ossConfig.accessKeySecret,
      stsToken: ossConfig.stsToken,
      bucket: ossConfig.bucket,
    });

    const uploadPromises = Array.from(files).map(file => uploadFile(file, client));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('获取OSS配置或上传过程出错:', error);
    throw error;
  }
};
