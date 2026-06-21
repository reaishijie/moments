import service from "./request";
import type { addLinkData } from "@/types/link";

export const addLink = (data: addLinkData ) => {
    return service({
        url: '/link',
        method: 'post',
        data,
    })
}

export const getLink = () => {
    return service({
        url: '/link',
        method: 'get',
    })
}