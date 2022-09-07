import { parseIniFile } from "../src/parser";
import { diagnosticsOfIniLines } from "../src/diagnostics";

const doc = `
root = true


[*]
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
indent_style = space
indent_size = 2

[*.txt]
indent_style = tab
indent_size = 4

[*.{diff,md}]
trim_trailing_whitespace = false
`

const doc2 = `
# top-most EditorConfig file
root = true

# Unix-style newlines with a newline ending every file
[*]
end_of_line = lf
insert_final_newline = true

# 4 space indentation
[*.py]
indent_style = space
indent_size = 4

# Tab indentation (no size specified)
[*.js]
indent_style = tab

# Indentation override for all JS under lib directory
[lib/**.js]
indent_style = space
indent_size = 2

# Matches the exact files either package.json or .travis.yml
[{package.json,.travis.yml}]
indent_style = space
indent_size = 2
`

const doc3 = `
[*]
max_line_length = 80
`


describe.only('end to end', () => {
  test('#1', () => {
    const ini = parseIniFile(doc, { console })
    expect(diagnosticsOfIniLines(ini).length).toBe(0)
  })
  test('#2', () => {
    const ini = parseIniFile(doc2, { console })
    expect(diagnosticsOfIniLines(ini).length).toBe(0)
  })
  test('#3', () => {
    const ini = parseIniFile(doc3, { console })
    console.log(diagnosticsOfIniLines(ini))
    expect(diagnosticsOfIniLines(ini).length).toBe(0)
  })
})
