const vscode = require('vscode')

exports.activate = function (context) {
    const channel = vscode.window.createOutputChannel('Guinea Pig')
    channel.appendLine('Hello World!')
    vscode.window.showInformationMessage('Hello World!')

    context.subscriptions.push(vscode.commands.registerCommand('test-extension.callme', () => {
		vscode.window.showInformationMessage('I got called!');
	}))
}
