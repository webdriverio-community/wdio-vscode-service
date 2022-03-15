import { input as inputImport } from './1.43.0'

export * from './1.43.0'
export const input = {
    ...inputImport,
    Input: {
        ...inputImport.Input,
        quickPickIndex: (index: number) => `.//div[@role='option' and @data-index='${index}']`
    }
} as const