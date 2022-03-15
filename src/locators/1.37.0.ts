export const activityBar = {
    ActivityBar: {
        elem: '#workbench.parts.activitybar',
        viewContainer: './/ul[@aria-label=\'Active View Switcher\']',
        label: 'aria-label',
        actionsContainer: './/ul[@aria-label=\'Manage\']',
        actionItem: '.action-item'
    },
    ViewControl: {
        attribute: 'class',
        klass: 'checked',
        scmId: '#workbench.view.scm',
        debugId: '#workbench.view.debug',
        badge: '.badge'
    }
} as const

export const bottomBar = {
    BottomBarPanel: {
        elem: '#workbench.parts.panel',
        problemsTab: 'Problems',
        outputTab: 'Output',
        debugTab: 'Debug Console',
        terminalTab: 'Terminal',
        maximize: 'Maximize Panel Size',
        restore: 'Restore Panel Size',
        tabContainer: '.panel-switcher-container',
        tab: (title: string) => `.//li[starts-with(@title, '${title}')]`,
        actions: '.title-actions',
        globalActions: '.title-actions',
        action: (label: string) => `.//a[starts-with(@title, '${label}')]`
    },
    BottomBarViews: {
        actionsContainer: (label: string) => `.//ul[@aria-label='${label}']`,
        channelOption: 'option',
        channelCombo: 'select',
        channelText: '.option-text',
        channelRow: '.monaco-list-row',
        textArea: 'textarea',
        clearText: '.clear-output'
    },
    ProblemsView: {
        elem: '#workbench.panel.markers',
        markersFilter: '.markers-panel-action-filter',
        input: 'input',
        collapseAll: '.collapse-all',
        markerRow: '.monaco-list-row',
        rowLabel: 'aria-label',
        markerTwistie: '.monaco-tl-twistie'
    },
    TerminalView: {
        elem: '#workbench.panel.terminal',
        actionsLabel: 'Terminal actions',
        textArea: '.xterm-helper-textarea',
        killTerminal: './/a[@title=\'Kill Terminal\']',
        newTerminal: './/a[starts-with(@title, \'New Terminal\')]',
        tabList: '.tabs-list',
        singleTab: '.single-terminal-tab',
        selectedRow: '.monaco-list-row selected',
        row: '.monaco-list-row',
        newCommand: 'terminal: create new integrated terminal'
    },
    DebugConsoleView: {
        elem: '#workbench.panel.repl'
    },
    OutputView: {
        elem: '#workbench.panel.output',
        actionsLabel: 'Output actions'
    }
} as const

export const editor = {
    EditorView: {
        elem: '#workbench.parts.editor',
        editorGroup: '.editor-group-container',
        settingsEditor: '#workbench.editor.settings2',
        webView: '#WebviewEditor',
        diffEditor: '.monaco-diff-editor',
        tab: '.tab',
        closeTab: '.tab-close',
        tabTitle: 'title',
        tabSeparator: ', tab',
        tabLabel: 'aria-label',
        actionContainer: '.editor-actions',
        actionItem: '.action-label'
    },
    Editor: {
        elem: '.editor-instance',
        inputArea: '.inputarea',
        title: '.label-name'
    },
    TextEditor: {
        activeTab: 'div.tab.active',
        editorContainer: '.monaco-editor',
        dataUri: 'data-uri',
        formatDoc: 'Format Document',
        marginArea: '.margin-view-overlays',
        lineNumber: (line: number) => `.//div[contains(@class, 'line-numbers') and text() = '${line}']`,
        lineOverlay: (line: number) => `.//div[contains(@class, 'line-numbers') and text() = '${line}']/..`,
        breakPoint: '.codicon-debug-breakpoint',
        debugHint: '.codicon-debug-hint',
        selection: '.cslr selected-text top-left-radius bottom-left-radius top-right-radius bottom-right-radius',
        findWidget: '.find-widget'
    },
    FindWidget: {
        toggleReplace: './/div[@title="Toggle Replace mode"]',
        replacePart: '.replace-part',
        findPart: '.find-part',
        matchCount: '.matchesCount',
        input: 'textarea',
        content: '.mirror',
        button: (title: string) => `.//div[@role='button' and starts-with(@title, "${title}")]`,
        checkbox: (title: string) => `.//div[@role='checkbox' and starts-with(@title, "${title}")]`
    },
    ContentAssist: {
        elem: '.suggest-widget',
        message: '.message',
        itemRows: '.monaco-list-rows',
        itemRow: '.monaco-list-row',
        itemLabel: '.label-name',
        itemText: './span/span',
        itemList: '.monaco-list',
        firstItem: './/div[@data-index=\'0\']'
    },
    SettingsEditor: {
        title: 'Settings',
        itemRow: '.monaco-list-row',
        header: '.settings-header',
        tabs: '.settings-tabs-widget',
        actions: '.actions-container',
        action: (label: string) => `.//a[@title='${label}']`,
        settingConstructor: (title: string, category: string) => `.//div[@class='monaco-tl-row' and .//span/text()='${title}' and .//span/text()='${category}: ']`,
        settingDesctiption: '.setting-item-description',
        comboSetting: 'select',
        comboOption: '.option-text',
        textSetting: 'input',
        checkboxSetting: '.setting-value-checkbox',
        checkboxChecked: 'aria-checked',
        linkButton: '.edit-in-settings-button',
        itemCount: '.settings-count-widget'
    },
    DiffEditor: {
        originalEditor: '.original-in-monaco-diff-editor',
        modifiedEditor: '.modified-in-monaco-diff-editor'
    },
    WebView: {
        iframe: 'iframe[class=\'webview ready\']',
        activeFrame: '#active-frame'
    }
} as const

export const menu = {
    ContextMenu: {
        contextView: '.context-view',
        elem: '.monaco-menu-container',
        itemConstructor: (label: string) => `.//li[a/span/@aria-label="${label}"]`,
        itemElement: '.action-item',
        itemLabel: '.action-label',
        itemText: 'aria-label',
        itemNesting: '.submenu-indicator',
        viewBlock: '.context-view-block'
    },
    TitleBar: {
        elem: '#workbench.parts.titlebar',
        itemConstructor: (label: string) => `.//div[@aria-label="${label}"]`,
        itemElement: '.menubar-menu-button',
        itemLabel: 'aria-label',
        title: '.window-title'
    },
    WindowControls: {
        elem: '.window-controls-container',
        minimize: '.window-minimize',
        maximize: '.window-maximize',
        restore: '.window-unmaximize',
        close: '.window-close'
    }
} as const

export const sideBar = {
    SideBarView: {
        elem: '#workbench.parts.sidebar'
    },
    ViewTitlePart: {
        elem: '.composite title',
        title: 'h2',
        action: '.action-label',
        actionLabel: 'title',
        actionContstructor: (title: string) => `.//a[@title='${title}']`
    },
    ViewContent: {
        elem: '.content',
        progress: '.monaco-progress-container',
        section: '.split-view-view',
        sectionTitle: '.title',
        sectionText: 'textContent',
        defaultView: '.explorer-folders-view',
        extensionsView: '.extensions-list'
    },
    ViewSection: {
        title: '.title',
        titleText: 'textContent',
        header: '.panel-header',
        headerExpanded: 'aria-expanded',
        actions: '.actions',
        actionConstructor: (label: string) => `.//a[contains(@class, 'action-label') and @role='button' and @title='${label}']`,
        button: './/a[@role=\'button\']',
        buttonLabel: 'title',
        level: 'aria-level',
        index: 'data-index',
        welcomeContent: '.welcome-view'
    },
    TreeItem: {
        actions: '.actions-container',
        actionLabel: '.action-label',
        actionTitle: 'title',
        twistie: '.monaco-tl-twistie'
    },
    DefaultTreeSection: {
        itemRow: '.monaco-list-row',
        itemLabel: 'aria-label',
        rowContainer: '.monaco-list',
        rowWithLabel: (label: string) => `.//div[@role='treeitem' and @aria-label='${label}']`,
        lastRow: './/div[@data-last-element=\'true\']'
    },
    DefaultTreeItem: {
        ctor: (label: string) => `.//div[@role='treeitem' and @aria-label='${label}']`,
        twistie: '.monaco-tl-twistie',
        tooltip: '.explorer-item'
    },
    CustomTreeSection: {
        itemRow: '.monaco-list-row',
        itemLabel: '.monaco-highlighted-label',
        rowContainer: '.monaco-list',
        rowWithLabel: (label: string) => `.//span[text()='${label}']`
    },
    CustomTreeItem: {
        elem: (label: string) => `.//div[@role='treeitem' and .//span[text()='${label}']]`,
        tooltipAttribute: 'aria-label',
        expandedAttr: 'aria-expanded',
        expandedValue: 'true',
        description: '.label-description'
    },
    ExtensionsViewSection: {
        items: '.monaco-list-rows',
        itemRow: '.monaco-list-row',
        itemTitle: '.name',
        searchBox: '.inputarea',
        textContainer: '.view-line',
        textField: '.mtk1'
    },
    ExtensionsViewItem: {
        version: '.version',
        author: '.author',
        description: '.description',
        install: '.install',
        manage: '.manage'
    },
    ScmView: {
        providerHeader: 'div[class*=\'panel-header scm-provider\']',
        providerRelative: './..',
        initButton: './/a[text()=\'Initialize Repository\']',
        providerTitle: '.title',
        providerType: '.type',
        action: '.action-label',
        inputField: 'textarea',
        changeItem: './/div[@role=\'treeitem\']',
        changeName: '.name',
        changeCount: '.monaco-count-badge',
        changeLabel: '.label-name',
        changeDesc: '.label-description',
        resource: '.resource',
        changes: './/div[@role="treeitem" and .//div/text()="CHANGES"]',
        stagedChanges: './/div[@role="treeitem" and .//div/text()="STAGED CHANGES"]',
        expand: '.monaco-tl-twistie',
        more: '.toolbar-toggle-more',
        multiMore: '.codicon-toolbar-more',
        multiScmProvider: '.scm-provider',
        singleScmProvider: `.scm-view`,
        multiProviderItem: './/div[@role=\'treeitem\' and @aria-level=\'1\']',
        itemLevel: (level: number) => `.//div[@role='treeitem' and @aria-level='${level}']`,
        itemIndex: (index: number) => `.//div[@role='treeitem' and @data-index='${index}']`
    },
    DebugView: {
        launchCombo: '.start-debug-action-item',
        launchSelect: 'select',
        launchOption: 'option',
        optionByName: (name: string) => `.//option[@value='${name}']`,
        startButton: '.codicon-debug-start'
    }
} as const

export const statusBar = {
    StatusBar: {
        elem: '#workbench.parts.statusbar',
        language: '#status.editor.mode',
        lines: '#status.editor.eol',
        encoding: '#status.editor.encoding',
        indent: '#status.editor.indentation',
        selection: '#status.editor.selection',
        notifications: '.notifications-center',
        bell: '#status.notifications',
        item: '.statusbar-item',
        itemTitle: 'aria-label'
    }
} as const

export const workbench = {
    Workbench: {
        elem: '.monaco-workbench',
        notificationContainer: '.notification-toast-container',
        notificationItem: '.monaco-list-row'
    },
    Notification: {
        message: '.notification-list-item-message',
        icon: '.notification-list-item-icon',
        source: '.notification-list-item-source',
        progress: '.monaco-progress-container',
        dismiss: '.clear-notification-action',
        expand: '.codicon-notifications-expand',
        actions: '.notification-list-item-buttons-container',
        action: '.monaco-button',
        actionLabel: 'title',
        standalone: (id: string) => `.//div[contains(@class, 'monaco-list-row') and @id='${id}']`,
        standaloneContainer: '.notifications-toasts',
        center: (index: number) => `.//div[contains(@class, 'monaco-list-row') and @data-index='${index}']`,
        buttonConstructor: (title: string) => `.//a[@role='button' and @title='${title}']`
    },
    NotificationsCenter: {
        elem: '.notifications-center',
        closeBtn: '.hide-all-notifications-action',
        clear: '.clear-all-notifications-action',
        row: '.monaco-list-row'
    },
    DebugToolbar: {
        ctor: '.debug-toolbar',
        button: (title: string) => `.codicon-debug-${title}`
    }
} as const

export const input = {
    Input: {
        inputBox: '.monaco-inputbox',
        input: '.input',
        quickPickIndex: (index: number) => `.//div[@role='treeitem' and @data-index='${index}']`,
        quickPickPosition: (index: number) => `.//div[@role='treeitem' and @aria-posinset='${index}']`,
        quickPickLabel: '.label-name',
        quickPickDescription: '.label-description',
        quickPickSelectAll: '.quick-input-check-all',
        titleBar: '.quick-input-titlebar',
        title: '.quick-input-title',
        backButton: '.codicon-quick-input-back'
    },
    InputBox: {
        elem: '.quick-input-widget',
        message: '.quick-input-message',
        progress: '.quick-input-progress',
        quickList: '.quick-input-list',
        rows: '.monaco-list-rows',
        row: '.monaco-list-row'
    },
    QuickOpenBox: {
        elem: '.monaco-quick-open-widget',
        progress: '.monaco-progress-container',
        quickList: '.quick-open-tree',
        row: './/div[@role=\'treeitem\']'
    }
} as const

export const dialog = {
    Dialog: {
        elem: '.monaco-dialog-box',
        message: '.dialog-message-text',
        details: '.dialog-message-detail',
        buttonContainer: '.dialog-buttons-row',
        button: '.monaco-text-button',
        closeButton: '.codicon-dialog-close'
    }
} as const

export const welcomeContentButtonSelector = ".//a[@class='monaco-button monaco-text-button']" as const
export const welcomeContentTextSelector = ".//p" as const

export const welcome = {
    WelcomeContent: {
        button: welcomeContentButtonSelector,
        buttonOrText: `${welcomeContentButtonSelector} | ${welcomeContentTextSelector}`,
        text: welcomeContentTextSelector
    }
} as const
