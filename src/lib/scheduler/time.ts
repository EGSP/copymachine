/**
 * Время в формате HH:MM
 */
export type Time = `${number}${number}:${number}${number}`;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isTime(time: string): time is Time {
    return TIME_REGEX.test(time);
}

/**
 * Парсит строку времени (HH:MM, от 00:00 до 23:59) в объект Time
 * @param time - Строка времени для парсинга
 * @returns Объект Time
 * @throws Ошибка, если строка времени не валидна
 * @example
 * parseTime("12:34") // "12:34"
 * parseTime("25:00") // Ошибка: Неверный формат времени: 25:00
 */
export function parseTime(time: string): Time {
    if (!isTime(time)) {
        throw new Error(`Неверный формат времени: ${time}`);
    }

    return time as Time;
}