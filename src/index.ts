import { createConnection, ProposedFeatures, TextDocumentSyncKind, DiagnosticSeverity, TextDocuments, MarkupKind, CompletionItem, CompletionItemKind, DocumentSymbol, SymbolKind, SignatureHelpRequest, SignatureHelp } from 'vscode-languageserver/node';
import type { InitializeParams, InitializeResult, Diagnostic, TextDocumentPositionParams, Hover, MarkupContent, SignatureHelpParams } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { diagnosticsOfIniLines, findMatchingDeclarationFromKey, requiredValue } from "./diagnostics";
import { parseIniFile, IniLine } from "./parser";
import { universalDeclarations, limited, Declaration } from "./editorconfig";
import { documentSymbols } from './documentsymbols';
import {parseSettings, declarations, EditorConfigParams} from "./settings";



const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
const state: Record<string, IniLine[]> = {};


connection.onInitialize((params: InitializeParams) => {
  connection.console.log('Tjong från ecLS');
  params.capabilities.notebookDocument
  parseSettings(params.initializationOptions as EditorConfigParams)

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true
      },
      hoverProvider: true,
      documentSymbolProvider: true,
      signatureHelpProvider: {
        triggerCharacters: ["a", "b", "i", "r"],
      },
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
    const stmt = declarations().filter(s => s.key == key)[0];

    let doc: MarkupContent = {
      kind: MarkupKind.Markdown,
      value: [
        `# ${key}`,
        stmt.description,
        '',
        'Accepted values: ' + acceptedValue(stmt),
        '',
        `[Link to editor config wiki](${stmt.link})`
      ].join('\n')
    };
    return {
      contents: doc
    }
  }
});

connection.onSignatureHelp(
  (what: SignatureHelpParams) => {
    const doc = documents.get(what.textDocument.uri)
    if (typeof doc !== "undefined") {
      const iniLines = parseIniFile(doc.getText(), { console: connection.console })
      const line = iniLines[what.position.line]
      if (line.is_comment || line.is_section) {
        return undefined;
      }

      const key = line.raw.split("=")[0]
      const declaration = findMatchingDeclarationFromKey(key)
      if (declaration) {
        const c: SignatureHelp = {
          signatures: [{
            label: requiredValue(declaration),
          }],

        }
        return c

      }
    }

  })
connection.onCompletion(
  (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    //const iniLines = parseIniFile(_textDocumentPosition.textDocument.uri.getText(), {console: connection.console})
    //const line = iniLines[_textDocumentPosition.position.line]

    return declarations().map((k, idx) => {
      const c: CompletionItem = {
        label: k.key,
        insertText: k.key + " = ",
        kind: CompletionItemKind.Text,
        data: idx,
      }
      return c;
    })
  }
);

connection.onCompletionResolve(
  (item: CompletionItem): CompletionItem => {
    item.detail = declarations()[item.data].key
    item.documentation = declarations()[item.data].description
    return item;
  }
);

connection.onDocumentSymbol((x) => {

  const r = documents.get(x.textDocument.uri)
  if (r) {
    const iniLines = parseIniFile(r.getText(), { console: connection.console })
    return [...documentSymbols(iniLines)]
  }
})


documents.listen(connection);
connection.listen();
