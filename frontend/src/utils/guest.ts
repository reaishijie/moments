import { nanoid } from "nanoid";

const GUEST_ID_KEY = 'guestId'

export function getOrCreateGuestId():string {
    let guestId = localStorage.getItem(GUEST_ID_KEY)

    if(!guestId) {
        guestId = nanoid()
        localStorage.setItem(GUEST_ID_KEY, guestId)
        // console.log('新游客访问，生成guestId：', guestId);
    }

    return guestId
}