
export type IniLine = {
	raw: string,
	section_group: string | null,
	is_section: boolean,
	is_comment: boolean,
}
type Connection = {
	console: {
		log: (x: string) => void,
	}
}
export function parseIniFile(file: string, connection: Connection): IniLine[] {

	let section_group: null | string = null;
	return file.split("\n").map(rawLine => {
		connection.console.log("ecls " + rawLine);
		let is_comment = false;
		let is_section = false;
		const trimmedLine = rawLine.trim();
		let line = trimmedLine;
		if (trimmedLine.match(/^\[/)) {
			section_group = trimmedLine;
			is_section = true;
		}
		if (trimmedLine.match(/^#/) || trimmedLine.match(/^;/)) {
			is_comment = true;
		}
		if (line.trim() === "") {
			section_group = null;
		}
		return {
			section_group,
			raw: trimmedLine,
			is_comment,
			is_section,
		};
	});
}



