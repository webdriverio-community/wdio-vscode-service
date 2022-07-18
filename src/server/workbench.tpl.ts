import type { TemplateOptions } from '../types'

export default function getWorkbench (opts: TemplateOptions) {
    return /* html */`
<!-- Copyright (C) Microsoft Corporation. All rights reserved. -->
<!DOCTYPE html>
<html>
    <head>
        <script>
            performance.mark('code/didStartRenderer')
        </script>
        <meta charset="utf-8" />

        <!-- Mobile tweaks -->
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Code" />
        <link rel="apple-touch-icon" href="${opts.baseUrl}/code-192.png" />

        <!-- Disable pinch zooming -->
        <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no"
        />

        <!-- Workbench Configuration -->
        <meta id="vscode-workbench-web-configuration" data-settings="${opts.webConfiguration}">

        <!-- Workbench Auth Session -->
        <meta id="vscode-workbench-auth-session" data-settings="${opts.authSession}">

        <!-- Builtin Extensions (running out of sources) -->
        <meta id="vscode-workbench-builtin-extensions" data-settings="${opts.builtinExtensions}">

        <!-- Workbench Icon/Manifest/CSS -->
        <link rel="icon" href="${opts.baseUrl}/favicon.ico" type="image/x-icon" />
        <link rel="manifest" href="${opts.baseUrl}/manifest.json">
        <link
            data-name="vs/workbench/workbench.web.main"
            rel="stylesheet"
            href="${opts.baseUrl}/out/vs/workbench/workbench.web.main.css"
        />
    </head>

    <body aria-label="">
    </body>

    <!-- Startup (do not modify order of script tags!) -->
    <script src="${opts.baseUrl}/out/vs/loader.js"></script>
    <script src="${opts.baseUrl}/out/vs/webPackagePaths.js"></script>
    <script>
        let baseUrl = '${opts.baseUrl}';
        Object.keys(self.webPackagePaths).map(function (key, index) {
            self.webPackagePaths[key] = baseUrl + '/node_modules/' + key + '/' + self.webPackagePaths[key];
        });
        require.config({
            baseUrl: baseUrl + '/out',
            recordStats: true,
            trustedTypesPolicy: window.trustedTypes?.createPolicy('amdLoader', {
                createScriptURL(value) {
                    if (value.startsWith(baseUrl)) {
                        return value;
                    }
                    throw new Error('Invalid script url: ' + value)
                }
            }),
            paths: self.webPackagePaths
        });
    </script>
    <script>
        performance.mark('code/willLoadWorkbenchMain');
    </script>
    <script src="${opts.baseUrl}/out/vs/workbench/workbench.web.main.nls.js"></script>
    <script src="${opts.baseUrl}/out/vs/workbench/workbench.web.main.js"></script>
    <script src="${opts.baseUrl}/out/vs/code/browser/workbench/workbench.js"></script>
</html>`
}
