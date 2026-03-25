import {
	createContext,
	useContext,
	useRef,
	type ReactNode,
} from "react";
import { useStore } from "zustand/react";
import { createStore, type StoreApi } from "zustand/vanilla";

export type DirtyMarkState = {
	isDirty: boolean;
	setDirty: (value?: boolean) => void;
	/** Чтение без подписки на isDirty: store.getState().getDirty() */
	getDirty: () => boolean;
};

function createDirtyMarkStore(): StoreApi<DirtyMarkState> {
	return createStore<DirtyMarkState>((set, get) => ({
		isDirty: false,
		setDirty: (value = true) => {
			if (get().isDirty === value) {
				return;
			}
			set({ isDirty: value });
		},
		getDirty: () => get().isDirty,
	}));
}

const DirtyMarkStoreContext = createContext<StoreApi<DirtyMarkState> | null>(
	null,
);

export function DirtyMarkProvider({ children }: { children: ReactNode }) {
	const storeRef = useRef<StoreApi<DirtyMarkState> | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createDirtyMarkStore();
	}
	return (
		<DirtyMarkStoreContext.Provider value={storeRef.current}>
			{children}
		</DirtyMarkStoreContext.Provider>
	);
}

/**
 * Селектор как в zustand: узкая подписка (например только s => s.setDirty — без ререндера при смене isDirty).
 */
export function useDirtyMarkStore<T>(
	selector: (state: DirtyMarkState) => T,
): T {
	const store = useContext(DirtyMarkStoreContext);
	if (!store) {
		throw new Error("useDirtyMarkStore нужно вызывать внутри DirtyMarkProvider");
	}
	return useStore(store, selector);
}
