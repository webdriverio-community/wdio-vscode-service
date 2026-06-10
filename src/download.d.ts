declare module '@xhmikosr/downloader' {
    export interface DownloadOptions {
        extract?: boolean
        strip?: number
        mode?: string | number
        headers?: Record<string, string>
        filename?: string
        agent?: unknown
    }
    export default function download(url: string, dest: string, opts?: DownloadOptions): Promise<void>
}
