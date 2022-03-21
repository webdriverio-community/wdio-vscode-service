import { ScmView, ScmProvider, MoreAction, ScmChange } from "./ScmView";
import { ContextMenu } from "../../menu/ContextMenu";
import { PluginDecorator, IPluginDecorator, ElementWithContextMenu, LocatorMap } from '../../utils'
import { ScmView as ScmViewLocators } from '../../../locators/1.61.0';

export interface NewScmView extends IPluginDecorator<typeof ScmViewLocators> { }
/**
 * New SCM view for code 1.47 onwards
 *
 * @category Sidebar
 */
@PluginDecorator(ScmViewLocators)
export class NewScmView extends ScmView {
    async getProviders(): Promise<ScmProvider[]> {
        const inputs = await this.inputField$$;
        if (inputs.length < 1) {
            return [];
        }

        const providers = await this.multiScmProvider$$;
        if (inputs.length === 1 && providers.length < 1) {
            return [await new SingleScmProvider(this.locatorMap, this.singleScmProvider$, this).wait()];
        }

        const elements = await this.multiProviderItem$$;
        return Promise.all(
            elements.map(async element => (
                new MultiScmProvider(this.locatorMap, element as any, this).wait()
            ))
        );
    }
}

export interface SingleScmProvider extends IPluginDecorator<typeof ScmViewLocators> { }
/**
 * Implementation for a single SCM provider
 *
 * @category Sidebar
 */
@PluginDecorator(ScmViewLocators)
export class SingleScmProvider extends ScmProvider {

    /**
     * There is no title available for a single provider
     */
    async getTitle(): Promise<string> {
        return '';
    }

    /**
     * No title available for single provider
     */
    async getType(): Promise<string> {
        return '';
    }

    async takeAction(title: string): Promise<boolean> {
        const view = this.view as NewScmView;
        const buttons = await view.getTitlePart().getActions();
        const names = await Promise.all(buttons.map(async button => button.getTitle()));

        const index = names.findIndex(name => name === title)
        if (index > -1) {
            await buttons[index].elem.click();
            return true;
        }
        return false;
    }

    async openMoreActions(): Promise<ContextMenu> {
        const view = this.view as NewScmView;
        return new MoreAction(this.locatorMap, view).openContextMenu();
    }

    async getChanges(staged: boolean = false): Promise<ScmChange[]> {
        const count = await this.getChangeCount(staged);
        const elements: WebdriverIO.Element[] = [];

        if (count > 0) {
            const header = staged
                ? await this.stagedChanges$
                : await this.changes$;
            const startIndex = +await header.getAttribute('data-index');
            const depth = +await header.getAttribute('aria-level') + 1;

            const items = await this.itemLevel$$(depth);
            for (const item of items) {
                const index = +await item.getAttribute('data-index');
                if (index > startIndex && index <= startIndex + count) {
                    elements.push(item);
                }
            }
        }
        return Promise.all(
            elements.map(async element => (
                new ScmChange(this.locatorMap, element as any, this).wait()
            ))
        );
    }
}

export interface MultiScmProvider extends IPluginDecorator<typeof ScmViewLocators> { }
/**
 * Implementation of an SCM provider when multiple providers are available
 *
 * @category Sidebar
 */
@PluginDecorator(ScmViewLocators)
export class MultiScmProvider extends ScmProvider {

    async takeAction(title: string): Promise<boolean> {
        const actions = await this.action$$;
        const names = await Promise.all(actions.map(async action => action.getAttribute('title')));
        const index = names.findIndex(item => item === title);

        if (index > -1) {
            await actions[index].click();
            return true;
        }
        return false;
    }

    async openMoreActions(): Promise<ContextMenu> {
        return new MultiMoreAction(this.locatorMap, this).openContextMenu();
    }

    async commitChanges(message: string): Promise<void> {
        const index = +await this.elem.getAttribute('data-index') + 1;
        const input = await this.view.itemIndex$(index);
        await input.clearValue();
        await input.addValue(message);
        await input.addValue(['Meta', 'Enter']);
    }

    async getChanges(staged: boolean = false): Promise<ScmChange[]> {
        const count = await this.getChangeCount(staged);
        const elements: WebdriverIO.Element[] = [];

        if (count > 0) {
            const index = +await this.elem.getAttribute('data-index');
            const headers = staged
                ? await this.stagedChanges$$
                : await this.changes$$;
            let header!: WebdriverIO.Element;

            for (const item of headers) {
                if (+await item.getAttribute('data-index') > index) {
                    header = item;
                }
            }
            if (!header) {
                return []
            }

            const startIndex = +await header.getAttribute('data-index');
            const depth = +await header.getAttribute('aria-level') + 1;

            const items = await this.view.itemLevel$$(depth);
            for (const item of items) {
                const index = +await item.getAttribute('data-index');
                if (index > startIndex && index <= startIndex + count) {
                    elements.push(item);
                }
            }
        }
        return Promise.all(
            elements.map(async element => (
                new ScmChange(this.locatorMap, element as any, this).wait()
            ))
        );
    }

    async getChangeCount(staged: boolean = false): Promise<number> {
        const locator = staged ? this.locators.stagedChanges : this.locators.changes;
        const rows = await this.view.elem.$$(locator);
        const index = +await this.elem.getAttribute('data-index');

        for (const row of rows) {
            if (+await row.getAttribute('data-index') > index) {
                const count = await rows[0].$(this.locators.changeCount);
                return +await count.getText();
            }
        }
        return 0;
    }
}

interface MultiMoreAction extends IPluginDecorator<typeof ScmViewLocators> { }
/**
 * Multi More Action
 *
 * @category Sidebar
 */
@PluginDecorator(ScmViewLocators)
class MultiMoreAction extends ElementWithContextMenu<typeof ScmViewLocators> {
    /**
     * @private
     */
    public locatorKey = 'ScmView' as const
    constructor(
        locators: LocatorMap,
        public scm: ScmProvider
    ) {
        super(locators, locators['ScmView'].multiMore as string, scm.elem);
    }
}
