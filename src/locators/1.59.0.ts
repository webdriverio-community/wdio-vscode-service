import { editor as editorImport } from './1.57.0'

export * from './1.57.0'
export const editor = {
    ...editorImport,
    FindWidget: {
        ...editorImport.FindWidget,
        toggleReplace: `.//div[@title="Toggle Replace"]`
    }
} as const