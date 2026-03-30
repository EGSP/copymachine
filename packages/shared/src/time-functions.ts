import type { Time } from "./time";


// export function getTimeNow(): Time{
//     const now = new Date();
//     return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}` as Time;
// }

export function toDate(time: Time): Date{
    const [hours, minutes] = time.split(":").map(Number);
    return new Date(0, 0, 0, hours, minutes);
}

export function toCurrentDate(time: Time): Date{
    const now = new Date();
    const timeDate = toDate(time);
    now.setHours(timeDate.getHours());
    now.setMinutes(timeDate.getMinutes());
    return now;
}

export enum TimeComparison {
    Less = -1,
    Equal = 0,
    Greater = 1,
}

export function compareTime(time1: Time, time2: Time): TimeComparison {
    const diff = (toDate(time1).getTime() - toDate(time2).getTime());
    return diff > 0 ? TimeComparison.Greater : diff < 0 ? TimeComparison.Less : TimeComparison.Equal;
}

export enum DayComparison {
    Less = -1,
    Equal = 0,
    Greater = 1,
}

