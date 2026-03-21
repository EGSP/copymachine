import { PathType } from "#/lib/files/files";

type PathInfo = {
    path: string;
    type: PathType
}

export type Plan = {
    source: PathInfo;
    target: PathInfo;
}