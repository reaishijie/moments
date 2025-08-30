function showTime(timestamp: number) {
    //获取文章时间，后期考虑使用数组，请求数据库批量存储到该数组中
    const articleTime = timestamp
    //当前时间戳
    const currentTime = Date.now()
    const extraTime = ((currentTime - articleTime) / 1000 / 60)  /**分钟级单位 */
    const mTime = Math.round(extraTime)
    const hTime = Math.floor(mTime / 60)
    const dTime = Math.floor(hTime / 24)
    // console.log(extraTime,mTime,hTime, currentTime, articleTime ) 
    // 时间判断
    if (mTime <= 1) {
        return '刚刚发布'
    } else if (mTime > 1 && mTime <= 60) {
        return `${mTime}分钟前`
    } else if (mTime > 60 && mTime <= 60 * 24) {
        return `${hTime}小时前`
    } else if (mTime > 60 * 24) {
        return `${dTime}天前`
    }
}

function showDetailTime(timestamp: number) {
    const articleTime = timestamp
    const detailTime = new Date(articleTime).toLocaleString()
    return detailTime
}

function formatTime(timestamp: number) {
    const articleTime = new Date(timestamp)
    const year = articleTime.getUTCFullYear()
    // 0表示1月 依次类推，所以+1
    const month = articleTime.getUTCMonth() + 1
    const data = articleTime.getUTCDate()
    // day是星期几，0为周日
    const day = articleTime.getUTCDay()
    const hour = articleTime.getUTCHours()
    const minute = articleTime.getUTCMinutes()
    const second = articleTime.getUTCSeconds()
    const millisecond = articleTime.getUTCMilliseconds()


    return {
        year,
        month,
        data,
        day,
        hour,
        minute,
        second,
        millisecond,
    }
}
export { showTime, showDetailTime, formatTime }