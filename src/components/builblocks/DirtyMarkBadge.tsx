import { Asterisk } from "lucide-react";
import { useDirtyMarkStore } from "#/contexts/DirtyMarkContext";

/** Индикатор несохранённых изменений — единственная узкая подписка на isDirty */
export default function DirtyMarkBadge() {
	const isDirty = useDirtyMarkStore((s) => s.isDirty);

	if (!isDirty) {
		return null;
	}

	return (
		<span
			className="inline-flex text-(--sea-ink-soft)"
			title="Есть несохранённые изменения"
			aria-hidden
		>
			<Asterisk className="size-4" strokeWidth={2.5} />
		</span>
	);
}
