// 防抖函数
const debounce = (fn: Function, delay: number) => {
    let timeoutId: number | undefined;
    return function(this: any, ...args: any[]) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
};
// 节流函数 (Throttle)
const throttle = (fn: Function, delay: number) => {
    let lastTime = 0; // 记录上次执行的时间

    return function(this: any, ...args: any[]) {
        const now = Date.now(); // 获取当前时间
        
        // 如果当前时间 - 上次执行时间 > 延迟时间，则执行函数
        if (now - lastTime >= delay) {
            lastTime = now;
            fn.apply(this, args);
        }
        // 否则，什么也不做，等待下一个周期
    };
};
export {
    debounce,
    throttle
}