import { TextDocument } from "vscode-languageserver-textdocument";

import * as fs from "fs";

(() => {

	const src = "/Users/lilja/dotfiles/nvim/.editorconfig"
	const fileContent = fs.readFileSync(src).toString();
	const document = TextDocument.create("file://.editorconfig", "editorconfig", 1, fileContent);


	// const textAfterCursor = fileContent.slice(10);
	for (const x of [...Array(100).keys()]) {
		console.log(
			document.positionAt(x),
			document.offsetAt(document.positionAt(x)),
			(fileContent.slice(x)[0] || "").replace("\n", "\\n"),
			x,
		);
	}

})()
