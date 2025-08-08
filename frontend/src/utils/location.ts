async function getLocation() {
  try {
    const response = await fetch(`http://127.0.0.1:9889/api/getLocation`)
    // 双重解构并重命名
    const {data:{data: result}} =await response.json()
    if (response.status != 200) {
      throw new Error('获取 IP 地址服务响应失败');
    }
    return {
      result
    }
  } catch (error) {
    console.error('获取 IP 地址失败:', error);
  }
}
export {
  getLocation
}