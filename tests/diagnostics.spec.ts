import { IniLine } from "../src/parser";
import { validateDeclaration, balancedBrackets } from "../src/diagnostics";
import {
	universalDeclarations,
} from "../src/editorconfig";
import {
	Failure
} from "../src/utils";

const findDeclarationByName = (x: string) => {
	const dec = universalDeclarations.find(k => k.key === x)
	if (typeof dec === "undefined") {
		throw new Error("Unknown declaration " + x);
	}
	return dec;
};

const toBasicIniLine = (str: string): IniLine => {
	return {
		section_group: null,
		raw: str,
		is_section: false,
		is_comment: false,
	}
}


test('indent_size', () => {
let v = validateDeclaration(
			findDeclarationByName("indent_size"),
			toBasicIniLine("indent_size = 2"),
		)
			console.log(v);
	expect(v.tag).toEqual("success");
	v = validateDeclaration(
		findDeclarationByName("indent_size"),
		toBasicIniLine("indent_size = -2"),
	) as Failure<{ message: string, character: number }>
	expect(v.tag).toEqual("failure")
	expect(v.value.message.includes("Must be either 'Positive integer', 'Tab'"))
	expect(v.value.character == 12)

	expect(
		validateDeclaration(
			findDeclarationByName("indent_size"),
			toBasicIniLine("indent_size = tab")
		).tag).toBe("success")
	expect(
		validateDeclaration(
			findDeclarationByName("indent_size"),
			toBasicIniLine("indent_size = Tab")
		).tag).toBe("success")
});

test('root', () => {
	expect(validateDeclaration(
		findDeclarationByName('root'),
		{
			raw: "root = true",
			is_comment: false,
			is_section: false,
			section_group: "[*.lua]",
		}
	).tag).toBe('failure')

	expect(validateDeclaration(
		findDeclarationByName('root'),
		{
			raw: "root = true",
			is_comment: false,
			is_section: false,
			section_group: null,
		}
	).tag).toBe('success')
})

test('brackets are balanced', () => {
	expect(balancedBrackets("[*.lua]").tag).toEqual("success")
	expect(balancedBrackets("[*.lua").tag).toEqual("failure")
	expect(balancedBrackets("[*.{lua]").tag).toEqual("failure")
	expect(balancedBrackets("[*.{lua}]").tag).toEqual("success")
})
