const api = import.meta.env.VITE_API_BASE_URL
console.log(api);

async function getLocation() {
  try {
    const response = await fetch(`${api}/location`)
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