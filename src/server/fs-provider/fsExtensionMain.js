/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, exports) => {

(()=>{"use strict";var e={};(()=>{var r=e;Object.defineProperty(r,"__esModule",{value:!0}),r.getErrorStatusDescription=r.xhr=r.configure=void 0,r.configure=(e,r)=>{},r.xhr=async e=>{const r=new Headers;if(e.headers)for(const t in e.headers){const s=e.headers[t];Array.isArray(s)?s.forEach((e=>r.set(t,e))):r.set(t,s)}e.user&&e.password&&r.set("Authorization","Basic "+btoa(e.user+":"+e.password));const t={method:e.type,redirect:e.followRedirects>0?"follow":"manual",mode:"cors",headers:r};e.data&&(t.body=e.data);const s=new Request(e.url,t),o=await fetch(s),a={};o.headers.forEach(((e,r)=>{a[r]=e}));const n=await o.arrayBuffer();return new class{constructor(){this.status=o.status,this.headers=a}get responseText(){return(new TextDecoder).decode(n)}get body(){return new Uint8Array(n)}}},r.getErrorStatusDescription=function(e){return String(e)}})();var r=exports;for(var t in e)r[t]=e[t];e.__esModule&&Object.defineProperty(r,"__esModule",{value:!0})})();

/***/ }),
/* 2 */
/***/ ((module) => {

"use strict";
module.exports = require("vscode");

/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MemFileSystemProvider = void 0;
const vscode_1 = __webpack_require__(2);
const vscode_uri_1 = __webpack_require__(4);
function newFileStat(type, size) {
    return Promise.resolve({ type, ctime: Date.now(), mtime: Date.now(), size });
}
function modifiedFileStat(stats, size) {
    return Promise.resolve({ type: stats.type, ctime: stats.ctime, mtime: Date.now(), size: size !== null && size !== void 0 ? size : stats.size });
}
class MemFileSystemProvider {
    constructor(scheme, root) {
        this.scheme = scheme;
        this.root = root;
        // --- manage file events
        this._onDidChangeFile = new vscode_1.EventEmitter();
        this.onDidChangeFile = this._onDidChangeFile.event;
        this._bufferedChanges = [];
    }
    // --- manage file metadata
    async stat(resource) {
        const entry = await this._lookup(resource, false);
        return entry.stats;
    }
    async readDirectory(resource) {
        const entry = await this._lookupAsDirectory(resource, false);
        const entries = await entry.entries;
        const result = [];
        entries.forEach((child, name) => result.push([name, child.type]));
        return result;
    }
    // --- manage file contents
    async readFile(resource) {
        const entry = await this._lookupAsFile(resource, false);
        return entry.content;
    }
    async writeFile(uri, content, opts) {
        const basename = vscode_uri_1.Utils.basename(uri);
        const parent = await this._lookupParentDirectory(uri);
        const entries = await parent.entries;
        let entry = entries.get(basename);
        if (entry && entry.type === vscode_1.FileType.Directory) {
            throw vscode_1.FileSystemError.FileIsADirectory(uri);
        }
        if (!entry && !opts.create) {
            throw vscode_1.FileSystemError.FileNotFound(uri);
        }
        if (entry && opts.create && !opts.overwrite) {
            throw vscode_1.FileSystemError.FileExists(uri);
        }
        const stats = newFileStat(vscode_1.FileType.File, content.byteLength);
        if (!entry) {
            entry = { type: vscode_1.FileType.File, name: basename, stats, content: Promise.resolve(content) };
            entries.set(basename, entry);
            this._fireSoon({ type: vscode_1.FileChangeType.Created, uri });
        }
        else {
            entry.stats = stats;
            entry.content = Promise.resolve(content);
        }
        this._fireSoon({ type: vscode_1.FileChangeType.Changed, uri });
    }
    // --- manage files/folders
    async rename(from, to, opts) {
        if (!opts.overwrite && await this._lookup(to, true)) {
            throw vscode_1.FileSystemError.FileExists(to);
        }
        const entry = await this._lookup(from, false);
        const oldParent = await this._lookupParentDirectory(from);
        const newParent = await this._lookupParentDirectory(to);
        const newName = vscode_uri_1.Utils.basename(to);
        const oldParentEntries = await oldParent.entries;
        oldParentEntries.delete(entry.name);
        entry.name = newName;
        const newParentEntries = await newParent.entries;
        newParentEntries.set(newName, entry);
        this._fireSoon({ type: vscode_1.FileChangeType.Deleted, uri: from }, { type: vscode_1.FileChangeType.Created, uri: to });
    }
    async delete(uri, opts) {
        const dirname = vscode_uri_1.Utils.dirname(uri);
        const basename = vscode_uri_1.Utils.basename(uri);
        const parent = await this._lookupAsDirectory(dirname, false);
        const parentEntries = await parent.entries;
        if (parentEntries.has(basename)) {
            parentEntries.delete(basename);
            parent.stats = newFileStat(parent.type, -1);
            this._fireSoon({ type: vscode_1.FileChangeType.Changed, uri: dirname }, { uri, type: vscode_1.FileChangeType.Deleted });
        }
    }
    async createDirectory(uri) {
        const basename = vscode_uri_1.Utils.basename(uri);
        const dirname = vscode_uri_1.Utils.dirname(uri);
        const parent = await this._lookupAsDirectory(dirname, false);
        const parentEntries = await parent.entries;
        const entry = { type: vscode_1.FileType.Directory, name: basename, stats: newFileStat(vscode_1.FileType.Directory, 0), entries: Promise.resolve(new Map()) };
        parentEntries.set(entry.name, entry);
        const stats = await parent.stats;
        parent.stats = modifiedFileStat(stats, stats.size + 1);
        this._fireSoon({ type: vscode_1.FileChangeType.Changed, uri: dirname }, { type: vscode_1.FileChangeType.Created, uri });
    }
    async _lookup(uri, silent) {
        if (uri.scheme !== this.scheme) {
            if (!silent) {
                throw vscode_1.FileSystemError.FileNotFound(uri);
            }
            else {
                return undefined;
            }
        }
        let entry = this.root;
        const parts = uri.path.split('/');
        for (const part of parts) {
            if (!part) {
                continue;
            }
            let child;
            if (entry.type === vscode_1.FileType.Directory) {
                child = (await entry.entries).get(part);
            }
            if (!child) {
                if (!silent) {
                    throw vscode_1.FileSystemError.FileNotFound(uri);
                }
                else {
                    return undefined;
                }
            }
            entry = child;
        }
        return entry;
    }
    async _lookupAsDirectory(uri, silent) {
        const entry = await this._lookup(uri, silent);
        if ((entry === null || entry === void 0 ? void 0 : entry.type) === vscode_1.FileType.Directory) {
            return entry;
        }
        throw vscode_1.FileSystemError.FileNotADirectory(uri);
    }
    async _lookupAsFile(uri, silent) {
        const entry = await this._lookup(uri, silent);
        if (!entry) {
            throw vscode_1.FileSystemError.FileNotFound(uri);
        }
        if (entry.type === vscode_1.FileType.File) {
            return entry;
        }
        throw vscode_1.FileSystemError.FileIsADirectory(uri);
    }
    _lookupParentDirectory(uri) {
        const dirname = vscode_uri_1.Utils.dirname(uri);
        return this._lookupAsDirectory(dirname, false);
    }
    watch(resource, opts) {
        // ignore, fires for all changes...
        return vscode_1.Disposable.from();
    }
    _fireSoon(...changes) {
        this._bufferedChanges.push(...changes);
        if (this._fireSoonHandle) {
            clearTimeout(this._fireSoonHandle);
        }
        this._fireSoonHandle = setTimeout(() => {
            this._onDidChangeFile.fire(this._bufferedChanges);
            this._bufferedChanges.length = 0;
        }, 5);
    }
    dispose() {
        this._onDidChangeFile.dispose();
    }
}
exports.MemFileSystemProvider = MemFileSystemProvider;


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "URI": () => (/* binding */ URI),
/* harmony export */   "Utils": () => (/* binding */ Utils)
/* harmony export */ });
/* provided dependency */ var process = __webpack_require__(5);
var LIB;LIB=(()=>{"use strict";var t={470:t=>{function e(t){if("string"!=typeof t)throw new TypeError("Path must be a string. Received "+JSON.stringify(t))}function r(t,e){for(var r,n="",o=0,i=-1,a=0,h=0;h<=t.length;++h){if(h<t.length)r=t.charCodeAt(h);else{if(47===r)break;r=47}if(47===r){if(i===h-1||1===a);else if(i!==h-1&&2===a){if(n.length<2||2!==o||46!==n.charCodeAt(n.length-1)||46!==n.charCodeAt(n.length-2))if(n.length>2){var s=n.lastIndexOf("/");if(s!==n.length-1){-1===s?(n="",o=0):o=(n=n.slice(0,s)).length-1-n.lastIndexOf("/"),i=h,a=0;continue}}else if(2===n.length||1===n.length){n="",o=0,i=h,a=0;continue}e&&(n.length>0?n+="/..":n="..",o=2)}else n.length>0?n+="/"+t.slice(i+1,h):n=t.slice(i+1,h),o=h-i-1;i=h,a=0}else 46===r&&-1!==a?++a:a=-1}return n}var n={resolve:function(){for(var t,n="",o=!1,i=arguments.length-1;i>=-1&&!o;i--){var a;i>=0?a=arguments[i]:(void 0===t&&(t=process.cwd()),a=t),e(a),0!==a.length&&(n=a+"/"+n,o=47===a.charCodeAt(0))}return n=r(n,!o),o?n.length>0?"/"+n:"/":n.length>0?n:"."},normalize:function(t){if(e(t),0===t.length)return".";var n=47===t.charCodeAt(0),o=47===t.charCodeAt(t.length-1);return 0!==(t=r(t,!n)).length||n||(t="."),t.length>0&&o&&(t+="/"),n?"/"+t:t},isAbsolute:function(t){return e(t),t.length>0&&47===t.charCodeAt(0)},join:function(){if(0===arguments.length)return".";for(var t,r=0;r<arguments.length;++r){var o=arguments[r];e(o),o.length>0&&(void 0===t?t=o:t+="/"+o)}return void 0===t?".":n.normalize(t)},relative:function(t,r){if(e(t),e(r),t===r)return"";if((t=n.resolve(t))===(r=n.resolve(r)))return"";for(var o=1;o<t.length&&47===t.charCodeAt(o);++o);for(var i=t.length,a=i-o,h=1;h<r.length&&47===r.charCodeAt(h);++h);for(var s=r.length-h,c=a<s?a:s,f=-1,u=0;u<=c;++u){if(u===c){if(s>c){if(47===r.charCodeAt(h+u))return r.slice(h+u+1);if(0===u)return r.slice(h+u)}else a>c&&(47===t.charCodeAt(o+u)?f=u:0===u&&(f=0));break}var l=t.charCodeAt(o+u);if(l!==r.charCodeAt(h+u))break;47===l&&(f=u)}var p="";for(u=o+f+1;u<=i;++u)u!==i&&47!==t.charCodeAt(u)||(0===p.length?p+="..":p+="/..");return p.length>0?p+r.slice(h+f):(h+=f,47===r.charCodeAt(h)&&++h,r.slice(h))},_makeLong:function(t){return t},dirname:function(t){if(e(t),0===t.length)return".";for(var r=t.charCodeAt(0),n=47===r,o=-1,i=!0,a=t.length-1;a>=1;--a)if(47===(r=t.charCodeAt(a))){if(!i){o=a;break}}else i=!1;return-1===o?n?"/":".":n&&1===o?"//":t.slice(0,o)},basename:function(t,r){if(void 0!==r&&"string"!=typeof r)throw new TypeError('"ext" argument must be a string');e(t);var n,o=0,i=-1,a=!0;if(void 0!==r&&r.length>0&&r.length<=t.length){if(r.length===t.length&&r===t)return"";var h=r.length-1,s=-1;for(n=t.length-1;n>=0;--n){var c=t.charCodeAt(n);if(47===c){if(!a){o=n+1;break}}else-1===s&&(a=!1,s=n+1),h>=0&&(c===r.charCodeAt(h)?-1==--h&&(i=n):(h=-1,i=s))}return o===i?i=s:-1===i&&(i=t.length),t.slice(o,i)}for(n=t.length-1;n>=0;--n)if(47===t.charCodeAt(n)){if(!a){o=n+1;break}}else-1===i&&(a=!1,i=n+1);return-1===i?"":t.slice(o,i)},extname:function(t){e(t);for(var r=-1,n=0,o=-1,i=!0,a=0,h=t.length-1;h>=0;--h){var s=t.charCodeAt(h);if(47!==s)-1===o&&(i=!1,o=h+1),46===s?-1===r?r=h:1!==a&&(a=1):-1!==r&&(a=-1);else if(!i){n=h+1;break}}return-1===r||-1===o||0===a||1===a&&r===o-1&&r===n+1?"":t.slice(r,o)},format:function(t){if(null===t||"object"!=typeof t)throw new TypeError('The "pathObject" argument must be of type Object. Received type '+typeof t);return function(t,e){var r=e.dir||e.root,n=e.base||(e.name||"")+(e.ext||"");return r?r===e.root?r+n:r+"/"+n:n}(0,t)},parse:function(t){e(t);var r={root:"",dir:"",base:"",ext:"",name:""};if(0===t.length)return r;var n,o=t.charCodeAt(0),i=47===o;i?(r.root="/",n=1):n=0;for(var a=-1,h=0,s=-1,c=!0,f=t.length-1,u=0;f>=n;--f)if(47!==(o=t.charCodeAt(f)))-1===s&&(c=!1,s=f+1),46===o?-1===a?a=f:1!==u&&(u=1):-1!==a&&(u=-1);else if(!c){h=f+1;break}return-1===a||-1===s||0===u||1===u&&a===s-1&&a===h+1?-1!==s&&(r.base=r.name=0===h&&i?t.slice(1,s):t.slice(h,s)):(0===h&&i?(r.name=t.slice(1,a),r.base=t.slice(1,s)):(r.name=t.slice(h,a),r.base=t.slice(h,s)),r.ext=t.slice(a,s)),h>0?r.dir=t.slice(0,h-1):i&&(r.dir="/"),r},sep:"/",delimiter:":",win32:null,posix:null};n.posix=n,t.exports=n},447:(t,e,r)=>{var n;if(r.r(e),r.d(e,{URI:()=>d,Utils:()=>P}),"object"==typeof process)n="win32"===process.platform;else if("object"==typeof navigator){var o=navigator.userAgent;n=o.indexOf("Windows")>=0}var i,a,h=(i=function(t,e){return(i=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&(t[r]=e[r])})(t,e)},function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Class extends value "+String(e)+" is not a constructor or null");function r(){this.constructor=t}i(t,e),t.prototype=null===e?Object.create(e):(r.prototype=e.prototype,new r)}),s=/^\w[\w\d+.-]*$/,c=/^\//,f=/^\/\//;function u(t,e){if(!t.scheme&&e)throw new Error('[UriError]: Scheme is missing: {scheme: "", authority: "'.concat(t.authority,'", path: "').concat(t.path,'", query: "').concat(t.query,'", fragment: "').concat(t.fragment,'"}'));if(t.scheme&&!s.test(t.scheme))throw new Error("[UriError]: Scheme contains illegal characters.");if(t.path)if(t.authority){if(!c.test(t.path))throw new Error('[UriError]: If a URI contains an authority component, then the path component must either be empty or begin with a slash ("/") character')}else if(f.test(t.path))throw new Error('[UriError]: If a URI does not contain an authority component, then the path cannot begin with two slash characters ("//")')}var l="",p="/",g=/^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/,d=function(){function t(t,e,r,n,o,i){void 0===i&&(i=!1),"object"==typeof t?(this.scheme=t.scheme||l,this.authority=t.authority||l,this.path=t.path||l,this.query=t.query||l,this.fragment=t.fragment||l):(this.scheme=function(t,e){return t||e?t:"file"}(t,i),this.authority=e||l,this.path=function(t,e){switch(t){case"https":case"http":case"file":e?e[0]!==p&&(e=p+e):e=p}return e}(this.scheme,r||l),this.query=n||l,this.fragment=o||l,u(this,i))}return t.isUri=function(e){return e instanceof t||!!e&&"string"==typeof e.authority&&"string"==typeof e.fragment&&"string"==typeof e.path&&"string"==typeof e.query&&"string"==typeof e.scheme&&"string"==typeof e.fsPath&&"function"==typeof e.with&&"function"==typeof e.toString},Object.defineProperty(t.prototype,"fsPath",{get:function(){return A(this,!1)},enumerable:!1,configurable:!0}),t.prototype.with=function(t){if(!t)return this;var e=t.scheme,r=t.authority,n=t.path,o=t.query,i=t.fragment;return void 0===e?e=this.scheme:null===e&&(e=l),void 0===r?r=this.authority:null===r&&(r=l),void 0===n?n=this.path:null===n&&(n=l),void 0===o?o=this.query:null===o&&(o=l),void 0===i?i=this.fragment:null===i&&(i=l),e===this.scheme&&r===this.authority&&n===this.path&&o===this.query&&i===this.fragment?this:new y(e,r,n,o,i)},t.parse=function(t,e){void 0===e&&(e=!1);var r=g.exec(t);return r?new y(r[2]||l,O(r[4]||l),O(r[5]||l),O(r[7]||l),O(r[9]||l),e):new y(l,l,l,l,l)},t.file=function(t){var e=l;if(n&&(t=t.replace(/\\/g,p)),t[0]===p&&t[1]===p){var r=t.indexOf(p,2);-1===r?(e=t.substring(2),t=p):(e=t.substring(2,r),t=t.substring(r)||p)}return new y("file",e,t,l,l)},t.from=function(t){var e=new y(t.scheme,t.authority,t.path,t.query,t.fragment);return u(e,!0),e},t.prototype.toString=function(t){return void 0===t&&(t=!1),w(this,t)},t.prototype.toJSON=function(){return this},t.revive=function(e){if(e){if(e instanceof t)return e;var r=new y(e);return r._formatted=e.external,r._fsPath=e._sep===v?e.fsPath:null,r}return e},t}(),v=n?1:void 0,y=function(t){function e(){var e=null!==t&&t.apply(this,arguments)||this;return e._formatted=null,e._fsPath=null,e}return h(e,t),Object.defineProperty(e.prototype,"fsPath",{get:function(){return this._fsPath||(this._fsPath=A(this,!1)),this._fsPath},enumerable:!1,configurable:!0}),e.prototype.toString=function(t){return void 0===t&&(t=!1),t?w(this,!0):(this._formatted||(this._formatted=w(this,!1)),this._formatted)},e.prototype.toJSON=function(){var t={$mid:1};return this._fsPath&&(t.fsPath=this._fsPath,t._sep=v),this._formatted&&(t.external=this._formatted),this.path&&(t.path=this.path),this.scheme&&(t.scheme=this.scheme),this.authority&&(t.authority=this.authority),this.query&&(t.query=this.query),this.fragment&&(t.fragment=this.fragment),t},e}(d),m=((a={})[58]="%3A",a[47]="%2F",a[63]="%3F",a[35]="%23",a[91]="%5B",a[93]="%5D",a[64]="%40",a[33]="%21",a[36]="%24",a[38]="%26",a[39]="%27",a[40]="%28",a[41]="%29",a[42]="%2A",a[43]="%2B",a[44]="%2C",a[59]="%3B",a[61]="%3D",a[32]="%20",a);function b(t,e){for(var r=void 0,n=-1,o=0;o<t.length;o++){var i=t.charCodeAt(o);if(i>=97&&i<=122||i>=65&&i<=90||i>=48&&i<=57||45===i||46===i||95===i||126===i||e&&47===i)-1!==n&&(r+=encodeURIComponent(t.substring(n,o)),n=-1),void 0!==r&&(r+=t.charAt(o));else{void 0===r&&(r=t.substr(0,o));var a=m[i];void 0!==a?(-1!==n&&(r+=encodeURIComponent(t.substring(n,o)),n=-1),r+=a):-1===n&&(n=o)}}return-1!==n&&(r+=encodeURIComponent(t.substring(n))),void 0!==r?r:t}function C(t){for(var e=void 0,r=0;r<t.length;r++){var n=t.charCodeAt(r);35===n||63===n?(void 0===e&&(e=t.substr(0,r)),e+=m[n]):void 0!==e&&(e+=t[r])}return void 0!==e?e:t}function A(t,e){var r;return r=t.authority&&t.path.length>1&&"file"===t.scheme?"//".concat(t.authority).concat(t.path):47===t.path.charCodeAt(0)&&(t.path.charCodeAt(1)>=65&&t.path.charCodeAt(1)<=90||t.path.charCodeAt(1)>=97&&t.path.charCodeAt(1)<=122)&&58===t.path.charCodeAt(2)?e?t.path.substr(1):t.path[1].toLowerCase()+t.path.substr(2):t.path,n&&(r=r.replace(/\//g,"\\")),r}function w(t,e){var r=e?C:b,n="",o=t.scheme,i=t.authority,a=t.path,h=t.query,s=t.fragment;if(o&&(n+=o,n+=":"),(i||"file"===o)&&(n+=p,n+=p),i){var c=i.indexOf("@");if(-1!==c){var f=i.substr(0,c);i=i.substr(c+1),-1===(c=f.indexOf(":"))?n+=r(f,!1):(n+=r(f.substr(0,c),!1),n+=":",n+=r(f.substr(c+1),!1)),n+="@"}-1===(c=(i=i.toLowerCase()).indexOf(":"))?n+=r(i,!1):(n+=r(i.substr(0,c),!1),n+=i.substr(c))}if(a){if(a.length>=3&&47===a.charCodeAt(0)&&58===a.charCodeAt(2))(u=a.charCodeAt(1))>=65&&u<=90&&(a="/".concat(String.fromCharCode(u+32),":").concat(a.substr(3)));else if(a.length>=2&&58===a.charCodeAt(1)){var u;(u=a.charCodeAt(0))>=65&&u<=90&&(a="".concat(String.fromCharCode(u+32),":").concat(a.substr(2)))}n+=r(a,!0)}return h&&(n+="?",n+=r(h,!1)),s&&(n+="#",n+=e?s:b(s,!1)),n}function x(t){try{return decodeURIComponent(t)}catch(e){return t.length>3?t.substr(0,3)+x(t.substr(3)):t}}var _=/(%[0-9A-Za-z][0-9A-Za-z])+/g;function O(t){return t.match(_)?t.replace(_,(function(t){return x(t)})):t}var P,j=r(470),U=function(t,e,r){if(r||2===arguments.length)for(var n,o=0,i=e.length;o<i;o++)!n&&o in e||(n||(n=Array.prototype.slice.call(e,0,o)),n[o]=e[o]);return t.concat(n||Array.prototype.slice.call(e))},I=j.posix||j;!function(t){t.joinPath=function(t){for(var e=[],r=1;r<arguments.length;r++)e[r-1]=arguments[r];return t.with({path:I.join.apply(I,U([t.path],e,!1))})},t.resolvePath=function(t){for(var e=[],r=1;r<arguments.length;r++)e[r-1]=arguments[r];var n=t.path||"/";return t.with({path:I.resolve.apply(I,U([n],e,!1))})},t.dirname=function(t){var e=I.dirname(t.path);return 1===e.length&&46===e.charCodeAt(0)?t:t.with({path:e})},t.basename=function(t){return I.basename(t.path)},t.extname=function(t){return I.extname(t.path)}}(P||(P={}))}},e={};function r(n){if(e[n])return e[n].exports;var o=e[n]={exports:{}};return t[n](o,o.exports,r),o.exports}return r.d=(t,e)=>{for(var n in e)r.o(e,n)&&!r.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]})},r.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r(447)})();const{URI,Utils}=LIB;
//# sourceMappingURL=index.js.map

/***/ }),
/* 5 */
/***/ ((module) => {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = void 0;
const request_light_1 = __webpack_require__(1);
const vscode_1 = __webpack_require__(2);
const fsProvider_1 = __webpack_require__(3);
const SCHEME = 'vscode-test-web';
function activate(context) {
    const serverUri = context.extensionUri.with({ path: '/static/mount', query: undefined });
    const serverBackedRootDirectory = new ServerBackedDirectory(serverUri, '');
    const disposable = vscode_1.workspace.registerFileSystemProvider(SCHEME, new fsProvider_1.MemFileSystemProvider(SCHEME, serverBackedRootDirectory));
    context.subscriptions.push(disposable);
    console.log(`vscode-test-web-support fs provider registers for ${SCHEME}, initial content from ${serverUri.toString(/*skipEncoding*/ true)}`);
}
exports.activate = activate;
class ServerBackedFile {
    constructor(_serverUri, name) {
        this._serverUri = _serverUri;
        this.name = name;
        this.type = vscode_1.FileType.File;
    }
    get stats() {
        if (this._stats === undefined) {
            this._stats = getStats(this._serverUri);
        }
        return this._stats;
    }
    set stats(stats) {
        this._stats = stats;
    }
    get content() {
        if (this._content === undefined) {
            this._content = getContent(this._serverUri);
        }
        return this._content;
    }
    set content(content) {
        this._content = content;
    }
}
class ServerBackedDirectory {
    constructor(_serverUri, name) {
        this._serverUri = _serverUri;
        this.name = name;
        this.type = vscode_1.FileType.Directory;
    }
    get stats() {
        if (this._stats === undefined) {
            this._stats = getStats(this._serverUri);
        }
        return this._stats;
    }
    set stats(stats) {
        this._stats = stats;
    }
    get entries() {
        if (this._entries === undefined) {
            this._entries = getEntries(this._serverUri);
        }
        return this._entries;
    }
    set entries(entries) {
        this._entries = entries;
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isEntry(e) {
    return e && (e.type === vscode_1.FileType.Directory || e.type === vscode_1.FileType.File) && typeof e.name === 'string' && e.name.length > 0;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isStat(e) {
    return e && (e.type === vscode_1.FileType.Directory || e.type === vscode_1.FileType.File) && typeof e.ctime === 'number' && typeof e.mtime === 'number' && typeof e.size === 'number';
}
async function getEntries(serverUri) {
    const url = serverUri.with({ query: 'readdir' }).toString(/*skipEncoding*/ true);
    const response = await (0, request_light_1.xhr)({ url });
    if (response.status === 200 && response.status <= 204) {
        try {
            const res = JSON.parse(response.responseText);
            if (Array.isArray(res)) {
                const entries = new Map();
                for (const r of res) {
                    if (isEntry(r)) {
                        const childPath = vscode_1.Uri.joinPath(serverUri, r.name);
                        const newEntry = r.type === vscode_1.FileType.Directory ? new ServerBackedDirectory(childPath, r.name) : new ServerBackedFile(childPath, r.name);
                        entries.set(newEntry.name, newEntry);
                    }
                }
                return entries;
            }
        }
        catch {
            // ignore
        }
        console.log(`Invalid server response format for ${url.toString(/*skipEncoding*/ true)}.`);
    }
    else {
        console.log(`Invalid server response for ${url.toString(/*skipEncoding*/ true)}. Status ${response.status}`);
    }
    return new Map();
}
async function getStats(serverUri) {
    const url = serverUri.with({ query: 'stat' }).toString(/*skipEncoding*/ true);
    const response = await (0, request_light_1.xhr)({ url });
    if (response.status === 200 && response.status <= 204) {
        const res = JSON.parse(response.responseText);
        if (isStat(res)) {
            return res;
        }
        throw vscode_1.FileSystemError.FileNotFound(`Invalid server response for ${serverUri.toString(/*skipEncoding*/ true)}.`);
    }
    throw vscode_1.FileSystemError.FileNotFound(`Invalid server response for ${serverUri.toString(/*skipEncoding*/ true)}. Status ${response.status}.`);
}
async function getContent(serverUri) {
    const response = await (0, request_light_1.xhr)({ url: serverUri.toString(/*skipEncoding*/ true) });
    if (response.status >= 200 && response.status <= 204) {
        return response.body;
    }
    throw vscode_1.FileSystemError.FileNotFound(`Invalid server response for ${serverUri.toString()}. Status ${response.status}.`);
}

})();

var __webpack_export_target__ = exports;
for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;
//# sourceMappingURL=fsExtensionMain.js.map
