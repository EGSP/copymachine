import { describe, expect, expectTypeOf, it } from "vitest";

import { isTime, parseTime, type Time } from "./time";

describe("isTime", () => {
	it.each([
		"00:00",
		"09:05",
		"12:34",
		"23:59",
	])("Время %s валидно", (value) => {
		expect(isTime(value)).toBe(true);
	});

	it.each([
		"",
		"9:00",
		"09:5",
		"24:00",
		"12:60",
		"ab:cd",
		"12-34",
		"1234",
	])("Время %s невалидно", (value) => {
		expect(isTime(value)).toBe(false);
	});
});

describe("parseTime", () => {
	it.each([
		"00:00",
		"09:05",
		"12:34",
		"23:59",
	])("Время %s валидно", (value) => {
		expect(parseTime(value)).toBe(value);
	});

	it("Тип Time в TypeScript корректен", () => {
		const result = parseTime("12:34");
		expectTypeOf(result).toEqualTypeOf<Time>();
	});

	it.each([
		"",
		"9:00",
		"09:5",
		"24:00",
		"12:60",
		"ab:cd",
	])("Время %s невалидно", (value) => {
		expect(() => parseTime(value)).toThrow(`Неверный формат времени: ${value}`);
	});
});
