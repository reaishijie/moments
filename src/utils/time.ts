function showTime(value:number) {
    //获取文章时间，后期考虑使用数组，请求数据库批量存储到该数组中
    const articleTime = value
    //当前时间戳
    const currentTime = Date.now()
    const extraTime = ((currentTime - articleTime) /1000 / 60)  /**分钟级单位 */
    const mTime = Math.round(extraTime)
    const hTime = Math.floor(mTime / 60)
    const dTime = Math.floor(hTime / 24)
    // console.log(extraTime,mTime,hTime, currentTime, articleTime ) 
    // 时间判断
    if(mTime <= 1) {
        return '刚刚发布'
    } else if(mTime > 1 && mTime <=60) {
        return `${mTime}分钟前`
    } else if(mTime >60 && mTime <= 60 *24) {
        return `${hTime}小时前`
    } else if(mTime > 60 * 24) {
        return `${dTime}天前`
    }

    
}

function showDetailTime(value:number){
    const articleTime = value
    console.log('当前文章时间戳为：', articleTime)
    const detailTime = new Date(articleTime).toLocaleString()
    console.log('文章时间为：', detailTime)
    return detailTime
}
showDetailTime(1753490992681)

export { showTime, showDetailTime }