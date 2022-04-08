import type { ChainablePromiseElement, ChainablePromiseArray } from 'webdriverio'

import * as allLocatorsTypes from '../locators/insiders'
import { ContextMenu } from '..'

type ClassWithFunctionLocatorsAsString<T> = {
    [key in keyof T as T[key] extends Function | undefined ? key : never]: T[key]
}

type ClassWithFunctionLocators$<T> = {
    // @ts-expect-error this fails compiling here but works when applied to a class
    [key in keyof ClassWithFunctionLocatorsAsString<T> as `${key}$`]: (
        // @ts-expect-error this fails compiling here but works when applied to a class
        ...args: Parameters<ClassWithFunctionLocatorsAsString<T>[key]>
    ) => ChainablePromiseElement<WebdriverIO.Element>
}

type ClassWithFunctionLocators$$<T> = {
    // @ts-expect-error this fails compiling here but works when applied to a class
    [key in keyof ClassWithFunctionLocatorsAsString<T> as `${key}$$`]: (
        // @ts-expect-error this fails compiling here but works when applied to a class
        ...args: Parameters<ClassWithFunctionLocatorsAsString<T>[key]>
    ) => ChainablePromiseArray<WebdriverIO.Element[]>
}

type ClassWithLocators$<T> = {
    [key in keyof T & string as T[key] extends String | undefined
        ? `${key}$`
        : never]: ChainablePromiseElement<WebdriverIO.Element>
}
type ClassWithLocators$$<T> = {
    [key in keyof T & string as T[key] extends String | undefined
        ? `${key}$$`
        : never]: ChainablePromiseArray<WebdriverIO.Element[]>
}

type LocatorProperties<T> = {
    readonly locatorMap: AllLocatorType,
    readonly locators: T
}

type AllLocatorType = typeof allLocatorsTypes
export type LocatorComponents = keyof AllLocatorType | (keyof AllLocatorType)[]
export type Locators = Record<string | symbol, string | Function>
export type VSCodeLocatorMap = Record<keyof AllLocatorType, Locators>
export type IPluginDecorator<T> = (
    ClassWithLocators$<T> & ClassWithLocators$$<T> &
    ClassWithFunctionLocators$<T> & ClassWithFunctionLocators$$<T>
)

export function PluginDecorator<T extends { new(...args: any[]): any }> (locators: Locators) {
    return (ctor: T) => {
        for (const [prop, globalLocator] of Object.entries(locators)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            ctor.prototype.__defineGetter__(`${prop}$`, function (this: LocatorProperties<any> & BasePage<any>) {
                const locator: Locators[string] = this.locators[prop] || globalLocator
                if (typeof locator === 'function') {
                    return (...args: string[]) => this.elem.$(locator(...args) as string)
                }
                return this.elem.$(locator)
            })
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            ctor.prototype.__defineGetter__(`${prop}$$`, function (this: LocatorProperties<any> & BasePage<any>) {
                const locator: Locators[string] = this.locators[prop] || globalLocator
                if (typeof locator === 'function') {
                    return (...args: string[]) => this.elem.$$(locator(...args) as string)
                }
                return this.elem.$$(locator)
            })
        }

        return ctor
    }
}

/**
 * remove the first two elements of a tuple
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Tail<T extends any[]> = T extends [infer A, infer B, ...infer R] ? R : never

export abstract class BasePage<PageLocators, LocatorMap extends Record<string, Locators> = VSCodeLocatorMap> {
    /**
     * @private
     */
    abstract locatorKey: keyof LocatorMap | (keyof LocatorMap)[]

    /**
     * @private
     */
    constructor (
        protected _locators: LocatorMap,
        protected _driver: WebdriverIO.Browser,
        private _baseElem?: string | ChainablePromiseElement<WebdriverIO.Element>,
        private _parentElem?: string | ChainablePromiseElement<WebdriverIO.Element>
    ) {}

    /**
     * Get the locator map of given page object
     *
     */
    get locators () {
        if (Array.isArray(this.locatorKey)) {
            return this.locatorKey.reduce((prev, locatorKey) => ({
                ...prev,
                ...this._locators[locatorKey]
            } as Locators), {} as Locators) as any as PageLocators
        }
        return this._locators[this.locatorKey] as any as PageLocators
    }

    /**
     * @private
     */
    get baseElem () {
        return this._baseElem
    }

    /**
     * @private
     */
    get locatorMap () {
        return this._locators
    }

    /**
     * Base element of given page object
     */
    get elem () {
        const baseLocator = (this.locators as any as Locators).elem
        if (this._baseElem) {
            return typeof this._baseElem === 'string'
                ? this._driver.$(this._baseElem)
                : this._baseElem
        }

        if (typeof baseLocator === 'string') {
            return this._driver.$(baseLocator)
        }

        return this._driver.$('html')
    }

    /**
     * Parent element of given page object
     */
    get parent () {
        if (this._parentElem) {
            return typeof this._parentElem === 'string'
                ? this._driver.$(this._parentElem)
                : this._parentElem
        }
        return this._driver.$('html')
    }

    /**
     * @private
     */
    setParentElement (parentElem: string | ChainablePromiseElement<WebdriverIO.Element>) {
        this._parentElem = parentElem
    }

    /**
     * Wait for the element to become visible
     * @param timeout custom timeout for the wait
     * @returns thenable self reference
     */
    async wait (timeout = 5000): Promise<this> {
        await this.elem.waitForDisplayed({ timeout })
        return this
    }

    load <T extends new (...params: any[]) => InstanceType<T>>(
        PageObject: T,
        ...params: Tail<ConstructorParameters<T>>) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return new PageObject(this.locatorMap, this._driver, ...params)
    }
}

/**
 * Abstract element that has a context menu
 */
export abstract class ElementWithContextMenu<T> extends BasePage<T> {
    /**
     * Open context menu on the element
     */
    async openContextMenu (): Promise<ContextMenu> {
        const contextMenuLocators = this.locatorMap.ContextMenu as AllLocatorType['ContextMenu']
        const workbench = this._driver.$((this.locatorMap.Workbench as AllLocatorType['Workbench']).elem)
        const menus = await this._driver.$$(contextMenuLocators.contextView)

        if (menus.length < 1) {
            await this.elem.click({ button: 2 })
            await this._driver.$(contextMenuLocators.contextView).waitForExist({ timeout: 2000 })
            return this.load(ContextMenu, workbench)
        }

        if (await workbench.$$(contextMenuLocators.viewBlock).length > 0) {
            await this.elem.click({ button: 2 })
            await this.elem.waitForDisplayed({ reverse: true, timeout: 1000 })
        }

        await this.elem.click({ button: 2 })
        return this.load(ContextMenu).wait()
    }
}
