-- Place this somewhere in:
-- ~/.local/share/nvim/site/pack/packer/start/nvim-lspconfig/lua/lspconfig/server_configurations/editorconfig.lua

local util = require 'lspconfig.util'

local root_files = { '.editorconfig', '.git' }
return {
  default_config = {
    cmd = { 'node', os.getenv('HOME') .. '/code/ecls/dist/index.js', '--stdio' },
    filetypes = { 'editorconfig' },
    root_dir = function(fname)
      return util.root_pattern(unpack(root_files))(fname)
    end,
    init_options = {
      buildDirectory = 'build',
    },
  },
  docs = {
    description = [[
https://github.com/Lilja/ecls
Editorconfig language server
]],
    default_config = {
      root_dir = [[root_pattern('.editorconfig')]],
    },
  },
}
