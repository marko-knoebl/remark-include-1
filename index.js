var VFile = require('vfile')
var path = require('path')
var fs = require('fs')
var fastGlob = require('fast-glob')

var parseInclude = /^@include (.*)(\n|$)/

module.exports = function (options) {
  var proc = this;
  options = options || { escaped: false, glob: false }
  var cwd = options.cwd || process.cwd()

  var prt = proc.Parser.prototype
  prt.blockTokenizers.include = tokenizer
  prt.blockMethods.unshift('include')

  return function transformer(ast, file) {
    // look for any "include" elements

    var i = 0;
    while (i < ast.children.length) {
      var child = ast.children[i];
      if (child.type === 'include') {
        var includedChildren = [];

        var includePattern = path.join(child.source.dirname || cwd, child.value)
        var includePathsUnique = matchMdPaths(includePattern, options)
        for (var includePath of includePathsUnique) {
          var fileContents = fs.readFileSync(includePath, {encoding: "utf-8"})
          var vfile = new VFile({path: includePath, contents: fileContents})
          var parsed = proc.parse(vfile)
          var includedChildrenFromCurrentFile = proc.runSync(parsed, vfile).children;
          includedChildren = includedChildren.concat(includedChildrenFromCurrentFile)
        }
        ast.children.splice(i, 1, ...includedChildren)
        i += includedChildren.length
      } else {
        i ++
      }
    }
  }
}

function tokenizer (eat, value, silent) {
  var self = this
  var settings = self.options
  var length = value.length + 1
  var index = -1
  var now = eat.now()
  var node

  if (silent && parseInclude.test(value)) {
    return true
  }

  // Replace all lines beginning with @include
  while (parseInclude.test(value)) {
    var file = value.match(parseInclude)[1]
    var frag = '@include ' + file
    value = value.slice(frag.length)
    eat(frag)({
      type: 'include',
      source: this.file,
      value: file
    })
  }

  return node
}

/**
 * returns an array of paths that match the given pattern
 * 
 * if glob is true, find matches based on a glob pattern
 * otherwise, look for "pattern", "pattern.md" or "pattern.markdown"
 * 
 * if escaped is true, interprets paths as markdown-escaped
 * e.g. "foo-\*.md" is interpreted as "foo-*.md"
 * this can accomodate formatters like prettier
 * note: double backslashes are (currently) not supported as escapes
 * e.g. "foo\\bar.md" will remain "foo\\bar.md"
 */
function matchMdPaths(pattern, {escaped, glob}) {
  if (escaped) {
    pattern = unescapeMarkdown(pattern)
  }
  var patterns = [pattern, pattern + ".md", pattern + ".markdown"]
  if (glob) {
    var includePaths = [];
    for (let pat of patterns) {
      includePaths = includePaths.concat(fastGlob.sync(pat))
    }
    // remove any duplicates that were matched
    // both with and without extensions
    var includePathsUnique = [...new Set(includePaths)]
    includePathsUnique.sort()
    if (includePaths.length === 0) {
      throw new Error('Unable to include ' + pattern)
    }
    return includePathsUnique
  } else {
    for (let pat of patterns) {
      if (fs.existsSync(pat)) {
        return [pat]
      }
    }
    throw new Error('Unable to include ' + pattern)
  }
}

function unescapeMarkdown(input) {
  // from https://github.com/wooorm/markdown-escapes/blob/master/index.js
  // (except for '\\')
  var escapableCharacters = [
    '`',
    '*',
    '{',
    '}',
    '[',
    ']',
    '(',
    ')',
    '#',
    '+',
    '-',
    '.',
    '!',
    '_',
    '>',
    '~',
    '|',
    '\n',
    '"',
    '$',
    '%',
    '&',
    "'",
    ',',
    '/',
    ':',
    ';',
    '<',
    '=',
    '?',
    '@',
    '^'
  ]
  // turn each character into a four-character sequence
  // by prepending backslashes
  // then convert to a RegExp which will make them two-character sequences
  // e.g.: * -> \\\* -> \*
  var escapedCharacters = escapableCharacters.map((char) => "\\\\\\" + char)
  var regexString = "(" + escapedCharacters.join("|") + ")"
  var regex = new RegExp(regexString, "g")
  return input.replace(regex, m => m.slice(1, 2))
}