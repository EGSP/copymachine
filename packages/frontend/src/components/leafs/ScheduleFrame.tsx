import { useState } from "react";
import type { Schedule } from "copymachine-shared";
import TimePicker from "#/components/builblocks/TimePicker";

type ScheduleFrameProps = {
	schedule?: Schedule;
	/** Вызывается при каждом изменении; родитель может писать в ref без setState */
	onScheduleChange?: (schedule: Schedule) => void;
};

const DEFAULT_TIME = "13:55";

function timeFromSchedule(schedule: Schedule | undefined): string {
	const t = schedule?.time;
	if (t === undefined || t === "") {
		return DEFAULT_TIME;
	}
	return typeof t === "string" ? t : t;
}

export default function ScheduleFrame({ schedule, onScheduleChange }: ScheduleFrameProps) {
	const [selectedTime, setSelectedTime] = useState(() => timeFromSchedule(schedule));

	const handleChange = (value: string) => {
		setSelectedTime(value);
		onScheduleChange?.({
			...schedule,
			time: value || undefined,
		});
	};

	return (
		<div className="mt-3 flex min-w-0 flex-col gap-2 border border-border p-2">
			<p className="text-xs text-muted-foreground">Расписание запуска</p>
			<TimePicker
				value={selectedTime}
				onChange={handleChange}
				aria-label="Время запуска"
				className="w-28"
			/>
			<p className="text-xs text-muted-foreground">
				Выбранное время: {selectedTime || "не выбрано"}
			</p>
		</div>
	);
}
