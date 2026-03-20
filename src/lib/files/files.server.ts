import { stat } from 'node:fs/promises'
import { basename, extname } from 'node:path'

import { FileMetaInfo } from './files'

export async function getFileMetaInfo(filePath: string): Promise<FileMetaInfo> {
  const fileStat = await stat(filePath)

  const metaInfo = new FileMetaInfo({
    path: filePath,
    name: basename(filePath),
    ext: extname(filePath),
    sizeBytes: fileStat.size,
    createdAt: fileStat.birthtime,
  })

  return metaInfo
}
