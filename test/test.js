var unified = require('unified')
var remarkParse = require('remark-parse')
var remarkStringify = require('remark-stringify')
var VFile = require('vfile')
var path = require('path')
var tap = require('tap')
var fs = require('fs')

var include = require('../index')

var processor = unified()
  .use(remarkParse)
  .use(include)
  .use(remarkStringify)
var processorGlob = unified()
  .use(remarkParse)
  .use(include, {glob: true})
  .use(remarkStringify)
var processorEscaped = unified()
  .use(remarkParse)
  .use(include, {escaped: true})
  .use(remarkStringify)
var processorGlobEscaped = unified()
  .use(remarkParse)
  .use(include, {escaped: true, glob: true})
  .use(remarkStringify)

var map = {
  '@include a.md': '# A',
  '@include a': '# A',
  '@include b': '# B',
  '@include sub/sub': '# A\n\n# sub',
  // for glob includes
  '@include c*.md': '# C1\n\n# C2',
  // for escaped includes
  '@include a\\.md': '# A',
  // glob and escaped
  '@include c\\*.md': '# C1\n\n# C2'
}

function transform (lines) {
  return lines
    .map(function (line) { return map[line] || line })
    .filter(function (v) { return !!v })
    .join('\n\n') + '\n'
}

function loadFile (filePath) {
  var fullpath = path.join(__dirname, filePath)
  return new VFile({
    path: fullpath,
    contents: fs.readFileSync(fullpath).toString()
  })
}

tap.test('should include by exact path', function (t) {
  var file = loadFile('exact.md')
  var expected = transform(file.contents.split('\n'))
  t.equal(
    processor.processSync(file).toString(),
    expected
  )
  t.end()
})

tap.test('should include by guessing extension', function (t) {
  var file = loadFile('guess.md')
  var expected = transform(file.contents.split('\n'))
  t.equal(
    processor.processSync(file).toString(),
    expected
  )
  t.end()
})

tap.test('should include from sub and super paths', function (t) {
  var file = loadFile('super.md')
  var expected = transform(file.contents.split('\n'))
  t.equal(
    processor.processSync(file).toString(),
    expected
  )
  t.end()
})

tap.test('should fail to include non-existent file', function (t) {
  t.throws(
    function () { processor.processSync('@include nope.md').toString() },
    'Unable to include ' + path.join(process.cwd(), 'nope.md')
  )
  t.end()
})

tap.test('should include by glob pattern', function(t) {
  var file = loadFile('glob.md')
  var expected = transform(file.contents.split('\n'))
  t.equal(
    processorGlob.processSync(file).toString(),
    expected
  )
  t.end()
})

tap.test('should include by escaped path', function (t) {
  var file = loadFile('escaped.md')
  var expected = transform(file.contents.split('\n'))
  t.equal(
    processorEscaped.processSync(file).toString(),
    expected
  )
  t.end()
})

tap.test('should include by escaped glob pattern', function (t) {
  var file = loadFile('glob-escaped.md')
  var expected = transform(file.contents.split('\n'))
  t.equal(
    processorGlobEscaped.processSync(file).toString(),
    expected
  )
  t.end()
})
