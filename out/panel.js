"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CozyCornerViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CozyCornerViewProvider {
    static viewType = 'cozyCornerView';
    _view;
    constructor() {
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('cozycorner') && this._view) {
                this.update();
            }
        });
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            retainContextWhenHidden: true,
        };
        webviewView.onDidDispose(() => {
            this._view = undefined;
        });
        this.update();
    }
    focus() {
        if (this._view) {
            this._view.show?.(true);
        }
        else {
            vscode.commands.executeCommand('workbench.view.explorer.focus');
            vscode.window.showInformationMessage('Expand the "Cozy Corner" section in the Explorer panel to see your image.');
        }
    }
    async selectImage() {
        const result = await vscode.window.showOpenDialog({
            canSelectMany: false,
            title: 'Select an image for Cozy Corner',
            filters: {
                'Images': ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'],
                'All files': ['*'],
            },
        });
        if (result && result[0]) {
            const config = vscode.workspace.getConfiguration('cozycorner');
            await config.update('imagePath', result[0].fsPath, vscode.ConfigurationTarget.Global);
            if (this._view) {
                this.update();
            }
            else {
                vscode.commands.executeCommand('workbench.view.explorer.focus');
                vscode.window.showInformationMessage('Expand the "Cozy Corner" section in the Explorer panel to see your image.');
            }
        }
    }
    update() {
        if (!this._view)
            return;
        const config = vscode.workspace.getConfiguration('cozycorner');
        const imagePath = config.get('imagePath', '');
        const size = config.get('size', 220);
        const opacity = config.get('opacity', 1.0);
        const brightness = config.get('brightness', 100);
        const frame = config.get('framePolaroid', false);
        const frameText = config.get('frameText', '');
        const frameColor = config.get('frameColor', '#ffffff');
        const frameOpacity = config.get('frameOpacity', 1.0);
        let imageDataUri = '';
        if (imagePath) {
            try {
                if (fs.existsSync(imagePath)) {
                    const fileBuffer = fs.readFileSync(imagePath);
                    const ext = path.extname(imagePath).toLowerCase().slice(1);
                    const mimeTypes = {
                        png: 'image/png',
                        jpg: 'image/jpeg',
                        jpeg: 'image/jpeg',
                        gif: 'image/gif',
                        svg: 'image/svg+xml',
                        webp: 'image/webp',
                        bmp: 'image/bmp',
                        ico: 'image/x-icon',
                    };
                    const mime = mimeTypes[ext] || 'image/png';
                    imageDataUri = `data:${mime};base64,${fileBuffer.toString('base64')}`;
                }
                else {
                    vscode.window.showWarningMessage(`Cozy Corner: Image not found at "${imagePath}"`);
                }
            }
            catch (err) {
                vscode.window.showErrorMessage(`Cozy Corner: Failed to load image — ${err}`);
            }
        }
        this._view.webview.html = this.getHtml(imageDataUri, size, opacity, brightness, frame, frameText, frameColor, frameOpacity);
    }
    getHtml(imageUri, size, opacity, brightness, frame, frameText, frameColor, frameOpacity) {
        const brightnessPercent = Math.round(brightness);
        const imageHtml = imageUri
            ? this.buildImageHtml(imageUri, size, opacity, brightnessPercent, frame, frameText, frameColor, frameOpacity)
            : this.buildPlaceholderHtml();
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
        font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
        background: transparent;
        color: var(--vscode-foreground, #ccc);
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 16px;
    }

    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
    }

    .image-wrapper {
        display: inline-block;
        max-width: 100%;
        line-height: 0;
    }

    .image-wrapper img {
        display: block;
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        transition: opacity 0.3s ease, filter 0.3s ease;
    }

    .image-wrapper.polaroid {
        position: relative;
        padding: 12px 12px 48px 12px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.15);
        border-radius: 4px;
        transform: rotate(-1deg);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        cursor: default;
    }

    .image-wrapper.polaroid:hover {
        transform: rotate(0deg) scale(1.02);
        box-shadow: 0 8px 28px rgba(0,0,0,0.35);
    }

    .image-wrapper.polaroid img {
        border-radius: 2px;
    }

    .polaroid-text {
        position: absolute;
        bottom: 10px;
        left: 14px;
        right: 14px;
        text-align: center;
        font-family: 'Georgia', 'Times New Roman', serif;
        font-style: italic;
        font-size: 11px;
        color: #777;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.3;
        pointer-events: none;
        user-select: none;
    }

    .placeholder {
        text-align: center;
        padding: 24px 16px;
        opacity: 0.65;
        user-select: none;
    }

    .placeholder-icon {
        font-size: 36px;
        margin-bottom: 12px;
    }

    .placeholder-text {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 8px;
    }

    .placeholder-hint {
        font-size: 12px;
        opacity: 0.7;
        line-height: 1.6;
    }

    .placeholder-hint kbd {
        background: var(--vscode-button-secondaryBackground, rgba(255,255,255,0.1));
        color: var(--vscode-button-secondaryForeground, inherit);
        padding: 1px 6px;
        border-radius: 3px;
        font-family: var(--vscode-font-family, inherit);
        font-size: 11px;
        border: 1px solid var(--vscode-button-secondaryBorder, rgba(255,255,255,0.15));
    }
</style>
</head>
<body>
    <div class="container">
        ${imageHtml}
    </div>
</body>
</html>`;
    }
    buildImageHtml(imageUri, size, opacity, brightnessPercent, frame, frameText, frameColor, frameOpacity) {
        const imgStyle = [
            `opacity: ${opacity}`,
            `filter: brightness(${brightnessPercent}%)`,
            `width: ${size}px`,
        ].join('; ');
        if (!frame) {
            return `<div class="image-wrapper">
    <img src="${imageUri}" alt="Cozy Corner" style="${imgStyle}" />
</div>`;
        }
        const bgColor = this.hexToRgba(frameColor, frameOpacity);
        const text = frameText.slice(0, 40).trim();
        const textHtml = text
            ? `<div class="polaroid-text">${this.escapeHtml(text)}</div>`
            : '';
        return `<div class="image-wrapper polaroid" style="background-color: ${bgColor}">
    <img src="${imageUri}" alt="Cozy Corner" style="${imgStyle}" />
    ${textHtml}
</div>`;
    }
    hexToRgba(hex, alpha) {
        const clean = hex.replace('#', '').trim();
        if (clean.length < 6)
            return `rgba(255, 255, 255, ${alpha})`;
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        if (isNaN(r) || isNaN(g) || isNaN(b))
            return `rgba(255, 255, 255, ${alpha})`;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    buildPlaceholderHtml() {
        return `<div class="placeholder">
    <div class="placeholder-icon">🖼️</div>
    <div class="placeholder-text">No image selected</div>
    <div class="placeholder-hint">
        Press <kbd>Ctrl+Shift+P</kbd> and run<br/>
        <strong>Cozy Corner: Select image</strong>
    </div>
</div>`;
    }
}
exports.CozyCornerViewProvider = CozyCornerViewProvider;
//# sourceMappingURL=panel.js.map