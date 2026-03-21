export type FileSizeUnit = 'B' | 'KB' | 'MB' | 'GB'

export type FileAutoSize = {
  value: number
  unit: FileSizeUnit
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100
}

export function getSizeAutoFromBytes(sizeBytes: number): FileAutoSize {
  if (sizeBytes < 1024) {
    return {
      value: roundToTwo(sizeBytes),
      unit: 'B',
    }
  }

  if (sizeBytes < 1024 * 1024) {
    return {
      value: roundToTwo(sizeBytes / 1024),
      unit: 'KB',
    }
  }

  if (sizeBytes < 1024 * 1024 * 1024) {
    return {
      value: roundToTwo(sizeBytes / (1024 * 1024)),
      unit: 'MB',
    }
  }

  return {
    value: roundToTwo(sizeBytes / (1024 * 1024 * 1024)),
    unit: 'GB',
  }
}

export class FileMetaInfo {
  path: string
  name: string
  ext: string
  sizeBytes: number
  createdAt: Date

  constructor(params: {
    path: string
    name: string
    ext: string
    sizeBytes: number
    createdAt: Date
  }) {
    this.path = params.path
    this.name = params.name
    this.ext = params.ext
    this.sizeBytes = params.sizeBytes
    this.createdAt = params.createdAt
  }

  getSizeKb(): number {
    return this.roundToTwo(this.sizeBytes / 1024)
  }

  getSizeMb(): number {
    return this.roundToTwo(this.sizeBytes / (1024 * 1024))
  }

  getSizeGb(): number {
    return this.roundToTwo(this.sizeBytes / (1024 * 1024 * 1024))
  }

  getSizeAuto(): FileAutoSize {
    return getSizeAutoFromBytes(this.sizeBytes)
  }

  private roundToTwo(value: number): number {
    return roundToTwo(value)
  }
}

export enum PathType {
	DIRECTORY = "directory",
	FILE = "file"
}export type PathInfo = {
    path: string;
    type: PathType;
};

