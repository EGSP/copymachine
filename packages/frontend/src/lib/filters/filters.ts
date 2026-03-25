
export interface FileFilter {
    resolve(): Promise<boolean>
}