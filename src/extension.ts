'use strict';

import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as Path from 'path';
import * as Fs from 'fs';
import { log } from 'util';

let getStream = require('get-stream');
let configuration = vscode.workspace.getConfiguration("touist");

export function activate(context: vscode.ExtensionContext) {

    let toVsPos = (pos) => {
        return new vscode.Position(pos.line, pos.col);
    };
    let fromVsPos = (pos: vscode.Position) => {
        return { line: pos.line, col: pos.character };
    };
    let toVsRange = (start, end) => {
        return new vscode.Range(toVsPos(start), toVsPos(end));
    };
    let provideLinter = async (document: vscode.TextDocument, token) => {
        if (token.isCancellationRequested) return null;
        if (token.isCancellationRequested) return null;
        let touistPath = configuration.get<string>('touistPath');

        let cmd = [touistPath, '--sat', '--linter', '--wrap-width=0', '-'];
        let cp = child_process.spawn(cmd[0],cmd.slice(1), {});
        log("cmd: "+cmd.join(" "))
        cp.stdin.write(document.getText());
        cp.stdin.end();
        let output = await getStream(cp.stderr);

        cp.unref();
        cp.on('close', (code) => {
            log('touist returned '+code);
            switch (code) {
                case 124: return vscode.window.showInformationMessage('error with arguments in \'touist\' command: '+cmd.join(' '));
                default:
            }
        })

        let diagnostics = [];

        log('output:\n'+output);
        let fromType = (type) => {
            switch (type) {
                case "error": return vscode.DiagnosticSeverity.Error;
                case "warning": return vscode.DiagnosticSeverity.Warning;
            }
        };
        let regex = /^([^:]+): line (\d+), col (\d+)-(\d+): (error|warning): (.*)$/mg;

        let pushDiag = (file, line: number, col1: number, col2: number, type, msg) => {
            let diag = new vscode.Diagnostic(
                toVsRange({ line, col: col1 }, { line, col: col2 }),
                msg,
                fromType(type.toLowerCase())
            );
            diag.source = 'touist';
            diagnostics.push(diag);
        };

        let msg = '';
        let file, row, col1, col2, type;
        output.split("\n").forEach(line => {
            let match = regex.exec(line);
            if (match !== null) {
                if (msg !== '') pushDiag(file, row, col1, col2, type, msg)
                file = match[1];
                row = +match[2];
                col1 = +match[3];
                col2 = +match[4];
                type = match[5];
                msg = match[6];
            } else {
                msg += '\n' + line;
            }
        });
        if (msg !== '') pushDiag(file, row, col1, col2, type, msg.trim())
        return diagnostics;
    };

    let LINTER_DEBOUNCE_TIMER = new WeakMap();
    let LINTER_TOKEN_SOURCE = new WeakMap();
    let LINTER_CLEAR_LISTENER = new WeakMap();

    let diagnosticCollection = vscode.languages.createDiagnosticCollection('touist');

    let lintDocument = (document: vscode.TextDocument) => {
        if (document.languageId !== 'touist') return;

        clearTimeout(LINTER_DEBOUNCE_TIMER.get(document));
        LINTER_DEBOUNCE_TIMER.set(document, setTimeout(async () => {
            if (LINTER_TOKEN_SOURCE.has(document)) {
                LINTER_TOKEN_SOURCE.get(document).cancel();
            }
            LINTER_TOKEN_SOURCE.set(document, new vscode.CancellationTokenSource());

            let diagnostics = await provideLinter(document, LINTER_TOKEN_SOURCE.get(document).token);
            diagnosticCollection.set(document.uri, diagnostics);
        }, configuration.get<number>('lintDelay')));
    };

    vscode.workspace.onDidSaveTextDocument(async (document) => {
        if (!configuration.get<boolean>('lintOnSave')) return;
        let diagnostics = await provideLinter(document, new vscode.CancellationTokenSource().token);
        diagnosticCollection.set(document.uri, diagnostics);
    });

    vscode.workspace.onDidChangeTextDocument(({ document }) => {
        if (!configuration.get<boolean>('lintOnChange')) return;

        if (document.languageId === 'touist') {
            lintDocument(document);
            return;
        }

        let relintOpenedDocuments = () => {
            diagnosticCollection.clear();
            for (let document of vscode.workspace.textDocuments) {
                if (document.languageId === 'touist') {
                    lintDocument(document);
                }
            }
        };
    });

    vscode.workspace.onDidCloseTextDocument((document) => {
        if (document.languageId === 'touist') {
            diagnosticCollection.delete(document.uri);
        }
    });
}

export function deactivate() {
}
