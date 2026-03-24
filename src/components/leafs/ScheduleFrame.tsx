import { useEffect, useState } from "react";
import type { Plan } from "#/background/plans/plans";
import TimePicker from "#/components/builblocks/TimePicker";
import { Input } from "#/components/ui/input";

type ScheduleFrameProps = {
	plan: Plan;
};

export default function ScheduleFrame({ plan }: ScheduleFrameProps) {
	const defaultScheduleTime = "13:55";
	const [selectedTime, setSelectedTime] = useState(defaultScheduleTime);

	useEffect(() => {
		setSelectedTime(defaultScheduleTime);
	}, [plan.id]);

	return (
		<div className="mt-3 flex min-w-0 flex-col gap-2 border border-border p-2">
			<p className="text-xs text-muted-foreground">Расписание плана: {plan.name}</p>
			<Input
				value={defaultScheduleTime}
				readOnly
				aria-label="Техническое дефолтное время"
				className="w-28"
			/>
			<TimePicker
				value={selectedTime}
				onChange={setSelectedTime}
				aria-label="Время запуска"
				className="w-28"
			/>
			<p className="text-xs text-muted-foreground">
				Выбранное время: {selectedTime || "не выбрано"}
			</p>
		</div>
	);
}
