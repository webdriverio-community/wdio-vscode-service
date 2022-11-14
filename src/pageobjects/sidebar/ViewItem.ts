import type { ChainablePromiseElement } from 'webdriverio'
import {
    IPageDecorator, BasePage, ElementWithContextMenu, PageDecorator, VSCodeLocatorMap
} from '../utils'
import {
    ViewSection as ViewSectionLocators,
    TreeItem as TreeItemLocators,
    CustomTreeItem as CustomTreeItemLocators,
    DefaultTreeItem as DefaultTreeItemLocators,
    ExtensionsViewItem as ExtensionsViewItemLocators
} from '../../locators/1.73.0'

/**
 * Abstract representation of a row in the tree inside a view content section
 * @hidden
 */
export type ViewItemLocators = (
    typeof ViewSectionLocators &
    typeof TreeItemLocators &
    typeof CustomTreeItemLocators &
    typeof DefaultTreeItemLocators &
    typeof ExtensionsViewItemLocators
)

export interface ViewItem extends IPageDecorator<ViewItemLocators> { }
/**
 * Arbitrary item in the side bar view
 *
 * @category Sidebar
 */
export abstract class ViewItem extends ElementWithContextMenu<ViewItemLocators> {
    /**
     * Select the item in the view.
     * Note that selecting the item will toggle its expand state when applicable.
     * @returns Promise resolving when the item has been clicked
     */
    async select (): Promise<void> {
        await this.elem.click()
    }
}

export interface TreeItem extends IPageDecorator<ViewItemLocators> { }
/**
 * TreeItem abstract class
 *
 * @category Sidebar
 */
export abstract class TreeItem extends ViewItem {
    /**
     * Retrieves the label of this view item
     */
    abstract getLabel (): Promise<string>

    /**
     * Retrieves the tooltip of this TreeItem.
     * @returns A promise resolving to the tooltip or undefined if the TreeItem has no tooltip.
     */
    abstract getTooltip (): Promise<string | undefined>

    /**
     * Retrieves the description of this TreeItem.
     * @returns A promise resolving to the tooltip or undefined if the TreeItem has no description.
     */
    abstract getDescription (): Promise<string | undefined>

    /**
     * Finds if the item has children by actually counting the child items
     * Note that this will expand the item if it was collapsed
     * @returns Promise resolving to true/false
     */
    async hasChildren (): Promise<boolean> {
        const children = await this.getChildren()
        return children && children.length > 0
    }

    /**
     * Finds whether the item is expanded. Always returns false if item has no children.
     * @returns Promise resolving to true/false
     */
    abstract isExpanded (): Promise<boolean>

    /**
     * Find children of an item, will try to expand the item in the process
     * @returns Promise resolving to array of TreeItem objects, empty array if item has no children
     */
    abstract getChildren (): Promise<TreeItem[]>

    /**
     * Finds if the item is expandable/collapsible
     * @returns Promise resolving to true/false
     */
    abstract isExpandable (): Promise<boolean>

    /**
     * Expands the current item, if it can be expanded and is collapsed.
     */
    async expand (): Promise<void> {
        if (await this.isExpandable() && !await this.isExpanded()) {
            await this.twistie$.click()
        }
    }

    /**
     * Find a child item with the given name
     * @returns Promise resolving to TreeItem object if the child item exists, undefined otherwise
     */
    async findChildItem (name: string): Promise<TreeItem | undefined> {
        const children = await this.getChildren()
        for (const item of children) {
            if (await item.getLabel() === name) {
                return item
            }
        }
        return undefined
    }

    /**
     * Collapse the item if expanded
     */
    async collapse (): Promise<void> {
        if (await this.isExpandable() && await this.isExpanded()) {
            await this.twistie$.click()
        }
    }

    /**
     * Find all action buttons bound to the view item
     *
     * @returns array of ViewItemAction objects, empty array if item has no
     * actions associated
     */
    async getActionButtons (): Promise<ViewItemAction[]> {
        await this.elem.moveTo()
        const container = await this.actions$

        if (!await container.isExisting()) {
            return []
        }

        const actions: ViewItemAction[] = []
        const items = await container.$$(this.locators.actionLabel)
        for (const item of items) {
            const elem = item.$((this.locatorMap.ViewSection.actionConstructor as () => string)())
            const label = (
                // v1.69.0 and before
                await elem.getAttribute(this.locators.actionTitle)
                // v1.70.0 and after
                || await item.getAttribute(this.locators.actionTitle)
            )
            actions.push(new ViewItemAction(this.locatorMap, elem, label, this))
        }
        return actions
    }

    /**
     * Find action button for view item by label
     * @param label label of the button to search by
     *
     * @returns ViewItemAction object if such button exists, undefined otherwise
     */
    async getActionButton (label: string): Promise<ViewItemAction | undefined> {
        const actions = await this.getActionButtons()
        if (actions.length > 0) {
            return actions.find((item) => item.getLabel().indexOf(label) > -1)
        }
        return undefined
    }

    /**
     * Find all child elements of a tree item
     * @param locator locator of a given type of tree item
     */
    protected async getChildItems (locator: string) {
        const items: WebdriverIO.Element[] = []
        await this.expand()

        const rows = await this.parent.$$(locator)
        const baseIndex = +await this.elem.getAttribute(this.locatorMap.ViewSection.index as string)
        const baseLevel = +await this.elem.getAttribute(this.locatorMap.ViewSection.level as string)

        for (const row of rows) {
            const level = +await row.getAttribute(this.locatorMap.ViewSection.level as string)
            const index = +await row.getAttribute(this.locatorMap.ViewSection.index as string)

            if (index <= baseIndex) {
                continue
            }
            if (level > baseLevel + 1) {
                continue
            }
            if (level <= baseLevel) {
                break
            }

            items.push(row)
        }

        return items
    }

    protected async findTwistie () {
        return this.twistie$
    }
}

export interface ViewItemAction extends IPageDecorator<typeof ViewSectionLocators> { }
/**
 * Action button bound to a view item
 *
 * @category Sidebar
 */
@PageDecorator(ViewSectionLocators)
export class ViewItemAction extends BasePage<typeof ViewSectionLocators> {
    /**
     * @private
     */
    public locatorKey = 'ViewSection' as const
    private label: string

    constructor (
        locators: VSCodeLocatorMap,
        elem: ChainablePromiseElement<WebdriverIO.Element>,
        label: string,
        viewItem: TreeItem
    ) {
        super(locators, elem, viewItem.elem)
        this.label = label
    }

    /**
     * Get label of the action button
     */
    getLabel (): string {
        return this.label
    }
}
