import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
};

const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_MIME_TYPES);

type ScaleMode = 'fit' | 'fill' | 'original';

export class CozyCornerViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'cozyCornerView';
    private _view: vscode.WebviewView | undefined;

    constructor() {
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('cozycorner') && this._view) {
                this.update();
            }
        });
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ): void | Thenable<void> {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: false,
        };

        webviewView.onDidDispose(() => {
            this._view = undefined;
        });

        return this.update();
    }

    focus() {
        vscode.commands.executeCommand('workbench.view.explorer.focus');
        if (!this._view) {
            vscode.window.showInformationMessage(
                'Expand the "Cozy Corner" section in the Explorer panel to see your image.'
            );
        }
    }

    async selectImage() {
        const result = await vscode.window.showOpenDialog({
            canSelectMany: false,
            title: 'Select an image for Cozy Corner',
            filters: {
                'Images': ALLOWED_EXTENSIONS,
            },
        });

        if (result && result[0]) {
            const config = vscode.workspace.getConfiguration('cozycorner');
            await config.update('imagePath', result[0].fsPath, vscode.ConfigurationTarget.Global);

            if (this._view) {
                await this.update();
            } else {
                vscode.commands.executeCommand('workbench.view.explorer.focus');
                vscode.window.showInformationMessage(
                    'Expand the "Cozy Corner" section in the Explorer panel to see your image.'
                );
            }
        }
    }

    private async update(): Promise<void> {
        if (!this._view) return;

        const config = vscode.workspace.getConfiguration('cozycorner');
        const rawSize = config.get<number>('size', 220);
        const rawOpacity = config.get<number>('opacity', 1.0);
        const rawBrightness = config.get<number>('brightness', 100);
        const rawPadding = config.get<number>('padding', 16);
        const rawBorderRadius = config.get<number>('borderRadius', 8);
        const shadow = config.get<boolean>('shadow', false);
        const rawScale = config.get<string>('scale', 'fit');
        const frame = config.get<boolean>('framePolaroid', false);
        const rawFrameText = config.get<string>('frameText', '');
        const rawFrameColor = config.get<string>('frameColor', '#ffffff');
        const rawFrameOpacity = config.get<number>('frameOpacity', 1.0);
        const imagePath = config.get<string>('imagePath', '');

        const size = Math.max(50, Math.min(800, Math.round(rawSize)));
        const opacity = Math.max(0, Math.min(1, rawOpacity));
        const brightness = Math.max(0, Math.min(100, Math.round(rawBrightness)));
        const padding = Math.max(0, Math.min(16, Math.round(rawPadding)));
        const borderRadius = Math.max(0, Math.min(8, Math.round(rawBorderRadius)));
        const scale: ScaleMode = (['fit', 'fill', 'original'] as ScaleMode[]).includes(rawScale as ScaleMode)
            ? (rawScale as ScaleMode)
            : 'fit';
        const frameOpacity = Math.max(0, Math.min(1, rawFrameOpacity));
        const frameColor = /^#[0-9a-fA-F]{6}$/.test(rawFrameColor)
            ? rawFrameColor
            : '#ffffff';
        const frameText = rawFrameText.slice(0, 40).trim();

        let imageDataUri = '';
        if (imagePath) {
            try {
                const stat = await fs.promises.stat(imagePath);

                if (stat.size > MAX_IMAGE_SIZE_BYTES) {
                    vscode.window.showWarningMessage(
                        'Cozy Corner: Image is too large. Please choose one under 10 MB.'
                    );
                } else {
                    const ext = path.extname(imagePath).toLowerCase().slice(1);
                    const mime = ALLOWED_MIME_TYPES[ext];

                    if (!mime) {
                        vscode.window.showWarningMessage(
                            `Cozy Corner: Unsupported file format ".${ext}". Accepted: png, jpg, jpeg, gif, webp, bmp, ico`
                        );
                    } else {
                        const fileBuffer = await fs.promises.readFile(imagePath);
                        imageDataUri = `data:${mime};base64,${fileBuffer.toString('base64')}`;
                    }
                }
            } catch (err) {
                const nodeErr = err as NodeJS.ErrnoException;
                if (nodeErr.code === 'ENOENT') {
                    vscode.window.showWarningMessage(
                        `Cozy Corner: Image not found at "${imagePath}"`
                    );
                } else {
                    vscode.window.showErrorMessage(
                        'Cozy Corner: Failed to read the image file. Check permissions or path.'
                    );
                }
            }
        }

        this._view.webview.html = this.getHtml(
            imageDataUri, size, opacity, brightness, padding, borderRadius,
            shadow, scale, frame, frameText, frameColor, frameOpacity,
        );
    }

    private getHtml(
        imageUri: string,
        size: number,
        opacity: number,
        brightness: number,
        padding: number,
        borderRadius: number,
        shadow: boolean,
        scale: ScaleMode,
        frame: boolean,
        frameText: string,
        frameColor: string,
        frameOpacity: number,
    ): string {
        const brightnessPercent = Math.round(brightness);

        const imageHtml = imageUri
            ? this.buildImageHtml(
                imageUri, size, opacity, brightnessPercent, padding, borderRadius,
                shadow, scale, frame, frameText, frameColor, frameOpacity,
              )
            : this.buildPlaceholderHtml(padding);

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src data:; style-src 'unsafe-inline';">
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
        padding: ${padding}px;
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
        border-radius: ${frame ? 2 : borderRadius}px;
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

    private buildImageHtml(
        imageUri: string,
        size: number,
        opacity: number,
        brightnessPercent: number,
        padding: number,
        borderRadius: number,
        shadow: boolean,
        scale: ScaleMode,
        frame: boolean,
        frameText: string,
        frameColor: string,
        frameOpacity: number,
    ): string {
        const imgStyleParts: string[] = [
            `opacity: ${opacity}`,
            `filter: brightness(${brightnessPercent}%)`,
        ];

        if (scale === 'fill') {
            imgStyleParts.push(`width: ${size}px`, `height: ${size}px`, 'object-fit: cover');
        } else if (scale === 'original') {
            imgStyleParts.push('width: auto', 'height: auto', 'max-width: 100%', 'max-height: 80vh');
        } else {
            imgStyleParts.push(`width: ${size}px`);
        }

        if (!frame) {
            const wrapperStyleParts: string[] = [];
            if (shadow) {
                wrapperStyleParts.push('box-shadow: 0 2px 12px rgba(0,0,0,0.15)');
            }
            const wrapperStyle = wrapperStyleParts.length
                ? ` style="${wrapperStyleParts.join('; ')}"`
                : '';

            return `<div class="image-wrapper"${wrapperStyle}>
    <img src="${imageUri}" alt="Cozy Corner" style="${imgStyleParts.join('; ')}" />
</div>`;
        }

        const bgColor = this.hexToRgba(frameColor, frameOpacity);
        const textHtml = frameText
            ? `<div class="polaroid-text">${this.escapeHtml(frameText)}</div>`
            : '';

        return `<div class="image-wrapper polaroid" style="background-color: ${bgColor}">
    <img src="${imageUri}" alt="Cozy Corner" style="${imgStyleParts.join('; ')}" />
    ${textHtml}
</div>`;
    }

    private hexToRgba(hex: string, alpha: number): string {
        const clean = hex.replace('#', '').trim();
        if (clean.length < 6) return `rgba(255, 255, 255, ${alpha})`;
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(255, 255, 255, ${alpha})`;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    private buildPlaceholderHtml(padding: number): string {
        const style = padding > 0 ? ` style="padding-top: ${padding}px;"` : '';
        return `<div class="placeholder"${style}>
    <div class="placeholder-icon">🖼️</div>
    <div class="placeholder-text">No image selected</div>
    <div class="placeholder-hint">
        Press <kbd>Ctrl+Shift+P</kbd> and run<br/>
        <strong>Cozy Corner: Select image</strong>
    </div>
</div>`;
    }
}
