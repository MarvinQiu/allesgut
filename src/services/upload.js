// 使用 FormData 和 fetch 实现文件上传
const API_ENDPOINT = 'https://your-api-endpoint.com/upload'; // 替换为实际的上传接口

// 获取上传凭证
const getUploadToken = async () => {
  try {
    const response = await fetch('/api/oss/token');
    if (!response.ok) throw new Error('获取上传凭证失败');
    return await response.json();
  } catch (error) {
    console.error('获取上传凭证失败:', error);
    throw error;
  }
};

// 上传单个文件
const uploadSingleFile = async (file) => {
  try {
    // 生成唯一文件名
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

    // 创建 FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);

    // 上传文件
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('上传失败');
    const result = await response.json();
    return result.url;
  } catch (error) {
    console.error('上传文件失败:', error);
    throw error;
  }
};

// 上传多个文件
export const uploadFiles = async (files) => {
  try {
    const uploadPromises = Array.from(files).map(file => uploadSingleFile(file));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('文件上传过程出错:', error);
    throw error;
  }
};

// 模拟上传（用于开发测试）
export const mockUploadFiles = async (files) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const urls = Array.from(files).map((file, index) => {
        // 使用 URL.createObjectURL 创建临时预览链接
        return URL.createObjectURL(file);
      });
      resolve(urls);
    }, 1000);
  });
};
