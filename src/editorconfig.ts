import { IniLine } from "./parser";

const safeInteger = (x: string): boolean => {
	try {
		parseInt(x)
		return true;
	} catch (e) {
		return false;
	}
};
const safeBoolean = (x: string): boolean => {
	try {
		return "true" == x || "false" == x;
	} catch (e) {
		return false;
	}
}
const anyBoolean = {
	description: "Boolean",
	validation: safeBoolean,
};

const mustBeTab = {
	description: "Tab",
	validation: (v: string) => v.toLowerCase() === "tab",
};
const canNotBeInASection = {
	description: "Outside of a section",
	validation: (_: string, line: IniLine) => {
		return line.section_group == null;
	}
};

const positiveInteger = {
	description: "Positive integer",
	validation: (x: string) => {
		if (safeInteger(x)) {
			return parseInt(x) > 0
		} else {
			return false;
		}
	}
};
type Validation = {
	description: string,
	validation: (value: string, line: IniLine) => boolean,
}
export type Declaration = {
	key: string,
	description: string,
	link: string,
	value?: string[],
	validation?: Validation[],
	special_validation?: Validation[],
}
export const universalDeclarations: Declaration[] = [{
	key: "indent_style",
	description: "Indentation Style",
	link: "https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties#indent_style",
	value: ["tab", "space"],
}, {
	key: "indent_size",
	description: "Indentation Size (in single-spaced characters)",
	link: "https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties#indent_size",
	validation: [mustBeTab, positiveInteger],
}, {
	key: "tab_width",
	validation: [positiveInteger],
	description: "Width of a single tabstop character",
	link: "https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties#tab_width",
}, {
	key: "end_of_line",
	value: ["lf", "crlf", "cr"],
	description: "Line ending file format (Unix, DOS, Mac)",
	link: "https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties#end_of_line",
}, {
	key: "charset",
	value: ["latin1", "utf-8", "utf-16be", "utf-16le", "utf-8-bom"],
	description: "File character encoding.",
	link: "https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties#charset",
}, {
	key: "trim_trailing_whitespace",
	description: "Denotes whether whitespace is removed from the end of lines",
	validation: [anyBoolean],
	link: "https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties#trim_trailing_whitespace",
}, {
	key: "insert_final_newline",
	description: "Denotes whether file should end with a newline",
	validation: [anyBoolean],
	link: "https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties#insert_final_newline",
}, {
	key: "root",
	description: "Special property that should be specified at the top of the file outside of any sections. Set to \"true\" to stop .editorconfig files search on current file.",
	validation: [anyBoolean],
	link: "https://editorconfig.org/",
	special_validation: [canNotBeInASection],
}
];

export const limited: Declaration[] = [{
	key: "max_line_length",
	description: "Forces hard line wrapping after the amount of characters specified. off to turn off this feature (use the editor settings).",
	link: "https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties#max_line_length",
	validation: [positiveInteger],
}];

