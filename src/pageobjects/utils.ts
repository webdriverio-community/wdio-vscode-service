import * as allLocatorsTypes from '../locators/1.61.0'

import { ContextMenu } from './menu/ContextMenu'
import type { Locators } from '../types'
import type { ChainablePromiseElement, ChainablePromiseArray } from 'webdriverio'

type ClassWithFunctionLocatorsAsString<T> = {
    [key in keyof T as T[key] extends Function | undefined ? key : never]: T[key]
}

type ClassWithFunctionLocators$<T> = {
    // @ts-expect-error this fails compiling here but works when applied to a class
    [key in keyof ClassWithFunctionLocatorsAsString<T> as `${key}$`]: (...args: Parameters<ClassWithFunctionLocatorsAsString<T>[key]>) => ChainablePromiseElement<WebdriverIO.Element>
}

type ClassWithFunctionLocators$$<T> = {
    // @ts-expect-error this fails compiling here but works when applied to a class
    [key in keyof ClassWithFunctionLocatorsAsString<T> as `${key}$$`]: (...args: Parameters<ClassWithFunctionLocatorsAsString<T>[key]>) => ChainablePromiseArray<WebdriverIO.Element[]>
}

type ClassWithLocators$<T> = {
    [key in keyof T & string as T[key] extends String | undefined ? `${key}$` : never]: ChainablePromiseElement<WebdriverIO.Element>
}
type ClassWithLocators$$<T> = {
    [key in keyof T & string as T[key] extends String | undefined ? `${key}$$` : never]: ChainablePromiseArray<WebdriverIO.Element[]>
}

type AllLocatorType = typeof allLocatorsTypes

export function PluginDecorator<T extends { new(...args: any[]): any }>(locators: Locators) {
    return (ctor: T) => {
        for (const [prop, locator] of Object.entries(locators)) {
            ctor.prototype.__defineGetter__(`${prop}$`, function (this: BasePage) {
                if (typeof locator === 'function') {
                    return (...args: string[]) => this.elem.$(locator(...args))
                }
                return this.elem.$(locator)
            })
            ctor.prototype.__defineGetter__(`${prop}$$`, function (this: BasePage) {
                if (typeof locator === 'function') {
                    return (...args: string[]) => this.elem.$$(locator(...args))
                }
                return this.elem.$$(locator)
            })
        }
        
        ctor.prototype.__defineGetter__(`locatorMap`, () => allLocatorsTypes)
        return class PageObject extends ctor {
            get locators () {
                return this._locators
            }
            get baseElem () {
                return this._baseElem
            }
        };
    }
}

export class BasePage {
    constructor (
        private _locators: Locators,
        private _baseElem?: string | ChainablePromiseElement<WebdriverIO.Element>,
        private _parentElem?: string | ChainablePromiseElement<WebdriverIO.Element>
    ) {}

    get elem () {
        const baseLocator = (this._locators as any as Locators).elem
        if (this._baseElem) {
            return typeof this._baseElem === 'string'
                ? browser.$(this._baseElem)
                : this._baseElem
        } else if (typeof baseLocator === 'string') {
            return browser.$(baseLocator)
        }

        return browser.$('html')
    }

    get parent () {
        if (this._parentElem) {
            return typeof this._parentElem === 'string'
                ? browser.$(this._parentElem)
                : this._parentElem
        }
        return browser.$('html')
    }

    setParentElement (parentElem: string | ChainablePromiseElement<WebdriverIO.Element>) {
        this._parentElem = parentElem
    }

    /**
     * Wait for the element to become visible
     * @param timeout custom timeout for the wait
     * @returns thenable self reference
     */
    async wait(timeout: number = 5000): Promise<this> {
        await this.elem.waitForDisplayed({ timeout });
        return this
    }
}

export type IPluginDecorator<T> = (
    ClassWithLocators$<T> & ClassWithLocators$$<T> &
    ClassWithFunctionLocators$<T> & ClassWithFunctionLocators$$<T> &
    { locatorMap: AllLocatorType, locators: T }
)


/**
 * Abstract element that has a context menu
 */
export abstract class ElementWithContextMenu extends BasePage {
    /**
     * Open context menu on the element
     */
    async openContextMenu(): Promise<ContextMenu> {
        // const workbench = await browser.$(this.locators.workbench.Workbench.elem)
        // const menus = await browser.$$(this.locators.menu.ContextMenu.contextView);

        // if (menus.length < 1) {
        //     await this.getDriver().actions().click(this, Button.RIGHT).perform();
        //     await this.getDriver().wait(until.elementLocated(ElementWithContexMenu.locators.ContextMenu.contextView), 2000);
        //     return new ContextMenu(workbench).wait();
        // } else if ((await workbench.findElements(ElementWithContexMenu.locators.ContextMenu.viewBlock)).length > 0) {
        //     await this.getDriver().actions().click(this, Button.RIGHT).perform();
        //     try {
        //         await this.getDriver().wait(until.elementIsNotVisible(this), 1000);
        //     } catch (err) {
        //         if (!(err instanceof error.StaleElementReferenceError)) {
        //             throw err;
        //         }
        //     }
        // }
        // await this.getDriver().actions().click(this, Button.RIGHT).perform();

        return new ContextMenu({} as any).wait();
    }
}