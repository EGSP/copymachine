import type { PathInfo } from "#/lib/files/files";

export type Plan = {
    id?: string;
    name?: string;

    source?: PathInfo;
    target?: PathInfo;
};