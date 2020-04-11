var remark = require('remark')
var VFile = require('vfile')
var path = require('path')
var tap = require('tap')
var fs = require('fs')

var include = require('../index')

var processor = remark().use(include)
var processorGlob = remark().use(include, {glob: true})

var map = {
  '@include a.md': '# A',
  '@include a': '# A',
  '@include b': '# B',
  '@include sub/sub': '# A\n\n# sub',
  '@include c*.md': '# C1\n\n# C2'
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
  var file = loadFile('pattern.md')
  var expected = transform(file.contents.split('\n'))
  t.equal(
    processorGlob.processSync(file).toString(),
    expected
  )
  t.end()
})
