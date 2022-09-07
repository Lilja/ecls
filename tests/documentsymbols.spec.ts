import {parseIniFile} from "../src/parser";
import {documentSymbols} from "../src/documentsymbols";

const edc = `
[*.lua]
indent_size = 2
`

describe('documentSymbols', () => {
  test('documentSymbols #1', () => {
    const ini = parseIniFile(edc, {console})
    const res = [...documentSymbols(ini)]
    expect(res.length).toBe(1)
    expect(res[0].name).toBe("*.lua")
    expect(res[0].children.length).toBe(1)
    expect(res[0].children[0].name).toBe("indent_size")
  })
  test('documentSymbols #2', () => {
    const doc = `
root = true
[*.md]
indent_size = 2
indent_style = tab

[*.ts]
indent_size = 4
indent_style = space
`
    const ini = parseIniFile(doc, {console})
    const res = [...documentSymbols(ini)]
    expect(res.length).toBe(3)
    expect(res[0].name).toBe("root")
    expect(res[0].children.length).toBe(0)
    expect(res[1].name).toBe("*.md")
    expect(res[1].children.length).toBe(2)
    expect(res[1].children[0].name).toBe("indent_size")
    expect(res[1].children[1].name).toBe("indent_style")
    /*expect(res[0].children[0].name).toBe("indent_size")*/
  })
})
