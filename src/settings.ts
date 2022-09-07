import {Declaration, universalDeclarations, limited} from "./editorconfig";

export type EditorConfigParams = {
  /**
    * Use limited declarations. Whether or not to use the limited declarations in the LSP.
    * @see https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties#supported-by-a-limited-number-of-editors
    * @default true
    * */
  useLimitedDeclarations: true,
}

const settings: EditorConfigParams = {
  useLimitedDeclarations: true,
}

export const declarations = (): Declaration[] => {
  if (settings.useLimitedDeclarations) {
    return universalDeclarations.concat(limited);
  }
  return limited;
}
export const parseSettings = (settings: Partial<EditorConfigParams>) => {
  if (typeof settings.useLimitedDeclarations !== "undefined") {
    settings["useLimitedDeclarations"] = settings.useLimitedDeclarations
  }
}


