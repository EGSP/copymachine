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
 * @throws Ошибка, если строка времени не валидна
 */
export function parseTime(time: string): Time {
	if (!isTime(time)) {
		throw new Error(`Неверный формат времени: ${time}`);
	}

	return time as Time;
}
