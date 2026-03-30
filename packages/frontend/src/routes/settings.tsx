import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	return (
		<main className="">
			<p className="text-sm text-(--sea-ink-soft)">
				Раздел настроек в разработке. Здесь позже появятся параметры приложения.
			</p>
		</main>
	);
}
