const vscode = require('vscode')

exports.activate = function () {
    const channel = vscode.window.createOutputChannel('Guinea Pig')
    channel.appendLine('Hello World!')
    vscode.window.showInformationMessage('Hello World!')
}
