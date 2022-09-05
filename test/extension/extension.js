const vscode = require('vscode')

const WEBVIEW_HTML = `
<html>
    <head>
        <title>My WebView</title>
    </head>
    <body>
        <h1>Hello World!</h1>
    </body>
</html>`

function openWebView () {
    const webview = vscode.window.createWebviewPanel(
        'column-one',
        'Example WebView Panel',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    )
    webview.webview.html = WEBVIEW_HTML
}

exports.activate = function (context) {
    const channel = vscode.window.createOutputChannel('Guinea Pig')
    channel.appendLine('Hello World!')
    vscode.window.showInformationMessage('Hello World!')

    context.subscriptions.push(vscode.commands.registerCommand('test-extension.callme', () => {
        vscode.window.showInformationMessage('I got called!');
    }))
    context.subscriptions.push(vscode.commands.registerCommand('test-extension.openWebView', openWebView))

    context.subscriptions.push(vscode.window.registerTreeDataProvider('testExtensionTreeview', {
        getChildren: (element) => {
            return element ? (element.children || []) : [
                {
                    label: 'Item 1',
                    children: [{ label: 'Item 1.1', tooltip: 'Tooltip for item 1.1', description: 'Description for item 1.1' }],
                    collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
                },
                { label: 'Item 2' }
            ]
        },
        getTreeItem: (element) => element,
    }))
}
