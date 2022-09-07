import { DeclarationRequest, DiagnosticSeverity } from 'vscode-languageserver/node';
import type { Diagnostic } from 'vscode-languageserver/node';
import type { IniLine } from "./parser";
import type { Declaration } from "./editorconfig";
import { universalDeclarations } from "./editorconfig";
import { Failure, Success, Result, isFailure } from "./utils";

function containsNonLatinCodepoints(s: string) {
  return /[^\u0000-\u00ff]/.test(s);
}

function currentLineRange(
  lineIndex: number,
  startCharacter?: number,
): Diagnostic["range"] {
  return {
    start: {
      line: lineIndex,
      character: startCharacter || 0,
    },
    end: {
      line: lineIndex,
      character: 1000
    }
  }
}

export const simplePluralize = (x: string[]) => {
  if (x.length == 1) {
    const ref = x[0][0].toLowerCase() + x[0].slice(1)
    return `Must be ${ref}`
  } else {
    return `Must be either ${x.join(', ')}`
  }
}

export function validateDeclaration(
  declaration: Declaration,
  line: IniLine,
): Result<boolean, { message: string, character: number }> {
  const equalSignPosition = line.raw.indexOf("=")
  let [_, value] = line.raw.split("=")
  // a = b
  // 01234
  const numberOfWhiteSpaceAfterEqualSign = value.search(/\S/);
  const valueStartPosition = equalSignPosition + numberOfWhiteSpaceAfterEqualSign + 1;
  value = value.trim()
  if (declaration.value) {
    if (!declaration.value.includes(value)) {
      return new Failure({
        message: `Invalid value for ${declaration.key}. Valid: ${declaration.value.join(', ')}, '${value}' is invalid.`,
        character: valueStartPosition,
      });
    }
  } else {
    const noValidationWasSuccessful = (declaration.validation?.map(
      k => !k.validation(value, line)
    ) || []).every(k => k);
    if (noValidationWasSuccessful) {
      const valid = declaration.validation?.map(k => "'" + k.description + "'") || [];
      return new Failure({
        message: `${value} is invalid. ${simplePluralize(valid)}`,
        character: valueStartPosition,
      })
    }
    const noSpecialValidationWasSuccessful = declaration.special_validation?.map(
      k => !k.validation(value, line)
    ).every(k => k) || false;
    if (noSpecialValidationWasSuccessful) {
      const valid = declaration.special_validation?.map(k => k.description) || [];
      return new Failure({
        message: `${simplePluralize(valid)}`,
        character: 0,
      })
    }
  }
  return new Success(true);
}

export function findMatchingDeclarationFromKey(key: string): Declaration | null {
  const r = universalDeclarations.find(k => k.key == key.trim())
  if (typeof r === "undefined") {
    return null;
  }
  return r;
}

function* analyzeLine(line: IniLine, lineIndex: number) {
  if (!line.raw.includes("=")) {
    const diag: Diagnostic = {
      message: "Line doesn't have an equal sign",
      range: currentLineRange(lineIndex),
    };
    yield diag
  } else {
    const splitted = line.raw.split("=")
    if (splitted.length > 2) {
      const diag: Diagnostic = {
        message: "More than one equal sign on line.",
        range: currentLineRange(lineIndex),
      };
      yield diag
    } else {
      const [key, _] = splitted;
      const decl = findMatchingDeclarationFromKey(key)
      if (!decl) {
        const diag: Diagnostic = {
          message: `Unknown declaration ${key}`,
          range: currentLineRange(lineIndex),
        }
        yield diag
      } else {
        const r = validateDeclaration(decl, line)
        if (isFailure(r)) {
          const diag: Diagnostic = {
            message: r.value.message,
            range: currentLineRange(lineIndex, r.value.character),
          }
          yield diag;
        }
      }
    }
  }
};

export function balancedBrackets(res: string): Result<boolean, string> {
  type Bracket = {
    '(': string[],
    '[': string[],
    '{': string[],
  }
  const brackets: Bracket = {
    '(': [],
    '[': [],
    '{': [],
  };
  const rules = {
    '(': () => brackets['('].push(""),
    '[': () => brackets['['].push(""),
    '{': () => brackets['{'].push(""),
    ')': () => brackets['('].pop(),
    ']': () => brackets['['].pop(),
    '}': () => brackets['{'].pop(),
  }

  for (const char of res.split("")) {
    if (typeof rules[char as "("] !== "undefined") {
      rules[char as "("]()
    }
  }

  if (brackets['('].length != 0) {
    return new Failure("Parenthesis/() not balanced.");
  } else if (brackets['['].length != 0) {
    return new Failure("Brackets/[] not balanced.");
  } else if (brackets['{'].length != 0) {
    return new Failure("Braces/{} not balanced.");
  }
  return new Success(true);
}

function* analyzeSection(line: IniLine, row: number) {
  const b = balancedBrackets(line.raw)
  if (isFailure(b)) {
    const diag: Diagnostic = {
      message: b.value,
      range: currentLineRange(row),
    }
    yield diag;
  }
}

export function diagnosticsOfIniLines(
  lines: IniLine[]
): Diagnostic[] {
  let diagnostics: Diagnostic[] = [];

  lines.map((line, row) => {
    if (line.raw.includes("=")) {
      for (const k of analyzeLine(line, row)) {
        diagnostics.push(k)
      }
    } else if (line.raw === "") {
      return undefined;
    } else {
      for (const k of analyzeSection(line, row)) {
        diagnostics.push(k)
      }
    }
  });
  return diagnostics;
}

// lol()
//
export const requiredValue = (d: Declaration): string => {
  if (d.value) {
    return simplePluralize(d.value)
  } else if (d.validation) {
    return simplePluralize(d.validation.map(k => k.description))
  } else {
    throw new Error("No such thing.")
  }
}
