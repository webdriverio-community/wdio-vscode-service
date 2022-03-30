import { Input as InputImport } from './1.43.0'

export * from './1.43.0'
export const locatorVersion = '1.44.0'
export const Input = {
    ...InputImport,
    quickPickIndex: (index: number) => `.//div[@role='option' and @data-index='${index}']`
}
