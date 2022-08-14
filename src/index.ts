import { createConnection, ProposedFeatures, TextDocumentSyncKind, DiagnosticSeverity, TextDocuments, MarkupKind } from 'vscode-languageserver/node';
import type { InitializeParams, InitializeResult, Diagnostic, TextDocumentPositionParams, Hover, MarkupContent } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { diagnosticsOfIniLines } from "./diagnostics";
import { parseIniFile, IniLine } from "./parser";
import { universalDeclarations, Declaration } from "./editorconfig";



const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
const state: Record<string, IniLine[]> = {};


connection.onInitialize((params: InitializeParams) => {
	connection.console.log('Tjong från ecLS');
	params.capabilities.notebookDocument

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			},
			hoverProvider: true,
		}
	};

	return result;
});


function validateTextDocument(textDocument: TextDocument): void {
	let diagnostics: Diagnostic[] = [];
	try {
		const iniLines = parseIniFile(textDocument.getText(), connection);
		diagnostics = diagnosticsOfIniLines(iniLines);
		connection.console.log("ecls diag!" + JSON.stringify(diagnostics));
		connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
		state[textDocument.uri] = iniLines
	} catch (e) {
		connection.console.log(`wtf ${e}`);
		diagnostics.push({
				severity: DiagnosticSeverity.Error,
				range: {
					start: textDocument.positionAt(0),
					end: textDocument.positionAt(1000),
				},
				message: `Unable to parse editorconfig. Is it correctly formated?`,
			})
	}
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

const acceptedValue = (statement: Declaration) => {
	if (statement.validation) {
		return statement.validation.map(k => k.description).join(", ")
	} else {
		return statement.value
	}

};

connection.onHover((params: TextDocumentPositionParams): Hover | undefined => {
	connection.console.log("ecls hover!" + JSON.stringify(params));
	if (state[params.textDocument.uri]) {
		const iniLines = state[params.textDocument.uri];
		const line = iniLines[params.position.line];
		if (line.is_comment || line.is_section) {
			return undefined;
		}
		const key = line.raw.split("=")[0].trim()
		const stmt = universalDeclarations.filter(s => s.key == key)[0];

		let doc: MarkupContent = {
			kind: MarkupKind.Markdown,
			value: [
				`# ${key}`,
				stmt.description,
				'',
				'Accepted values:' + acceptedValue(stmt),
				'',
				`[Link to editor config wiki](${stmt.link})`
			].join('\n')
		};
		return {
			contents: doc
		}
	}
});

documents.listen(connection);
connection.listen();
