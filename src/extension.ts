import * as vscode from 'vscode';
import { CozyCornerViewProvider } from './panel';

export function activate(context: vscode.ExtensionContext) {
    const provider = new CozyCornerViewProvider();

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('cozyCornerView', provider),
        vscode.commands.registerCommand('cozycorner.selectImage', () => provider.selectImage()),
        vscode.commands.registerCommand('cozycorner.focus', () => provider.focus()),
    );
}

export function deactivate() {}
