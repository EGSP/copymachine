import PlansList from "#/components/leafs/PlansList";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "#/components/ui/resizable";
import { DirtyMarkProvider } from "#/contexts/DirtyMarkContext";
import { PlanSelectionGuardProvider } from "#/contexts/PlanSelectionGuardContext";
import { usePlansStore } from "#/stores/plansStore";
import { PlanWindow } from "./PlanWindow";

type PlansFrameProps = {
	plansQueryEnabled: boolean;
};

export default function PlansFrame({ plansQueryEnabled }: PlansFrameProps) {
	const selectedPlan = usePlansStore((s) => s.plan);

	return (
		<DirtyMarkProvider>
			<PlanSelectionGuardProvider>
				<ResizablePanelGroup orientation="horizontal">
					<ResizablePanel defaultSize={"21%"}>
						<PlansList plansQueryEnabled={plansQueryEnabled} />
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel>
						{selectedPlan ? <PlanWindow /> : null}
					</ResizablePanel>
				</ResizablePanelGroup>
			</PlanSelectionGuardProvider>
		</DirtyMarkProvider>
	);
}
