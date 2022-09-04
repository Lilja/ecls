import { DocumentSymbol, SymbolKind } from "vscode-languageserver";
import type { IniLine } from "./parser";

function typeSafeFilter(x: number | undefined): x is number {
  return typeof x !== "undefined";
}

function findRootDeclarationAndSectionIndices(lines: IniLine[]): number[] {
  return lines.map((val, idx) => {
    // section
    if (val.is_section) {
      return idx;
    }
    // root decl.
    if (val.raw.includes("=") && val.section_group == null) {
      return idx;
    }
    return undefined
  }).filter(typeSafeFilter)

}

export function* documentSymbols(
  lines: IniLine[],
) {
  const indices = findRootDeclarationAndSectionIndices(lines);
  console.log("Indices", indices);
  for (const index of findRootDeclarationAndSectionIndices(lines)) {
    const startRange: DocumentSymbol["range"]["start"] = {
        line: index,
        character: 0,
    }
    const k = lines[index];
    console.log("Row", k);
    const children: DocumentSymbol[] = [];
    if (k.is_comment || k.raw == "") {
      continue;
    }
    const range = {
      start: startRange,
      end: {
        line: index,
        character: 9999,
      }
    }
    if (!k.is_section) {
      console.log("Yielding early!")
      yield {
        range,
        kind: SymbolKind.Field,
        selectionRange: range,
        name: k.raw.split("=")[0].trim(),
        children,
      }
      continue
    }

    let localIndex = 1;
    let next = lines[index + localIndex]
    let lastIndex = 0;
    while (next.section_group) {
      console.log("loop", index, localIndex, next)
      const childRange: DocumentSymbol["range"] = {
        start: {
          line: index + localIndex,
          character: 0,
        },
        end: {
          line: index + localIndex,
          character: 1000,
        }
      }
      const d = {
        range: childRange,
        selectionRange: childRange,
        name: next.raw.split("=")[0].trim(),
        kind: SymbolKind.Field,
      }
      children.push(d)
      console.log("Doc", d)
      localIndex++;
      next = lines[index + localIndex]
      lastIndex = index + localIndex;
    }
    const rangeWithChildren = {
      start: {
        line: index,
        character: 0,
      },
      end: {
        line: lastIndex,
        character: 1000
      }
    }
    yield {
      range: rangeWithChildren,
      kind: SymbolKind.Field,
      selectionRange: rangeWithChildren,
      name: k.raw.replace(/\[*\]*/g, ""),
      children,
    }
  }
}

