# remark-include

With remark-include, you can use `@include` statements to compose markdown
files together.

This repository is based on <https://github.com/Qard/remark-include>. Compared to the original additionally supports glob patterns and has fixed tests.

## Installation

```console
npm install @karuga/remark-include
```

## Example

```js
const unified = require('unified');
const remarkParse = require('remark-parse');
const remarkInclude = require('@karuga/remark-include');
const remarkStringify = require('remark-stringify');

const processor = unified()
  .use(remarkParse)
  .use(remarkInclude, { cwd: __dirname, glob: true, escaped: true })
  .use(remarkStringify);

const input = `
# My Memoirs

@include chapters/*.md
@include appendix.md
`;

const result = processor.processSync(input).toString();
```

## Usage

### Path resolution

The input can be either a _string_ or a [VFile](http://npmjs.org/package/vfile)

If the input is a VFile, includes will be relative to its location.

If the input is a string you can explicitly supply the base directory via `use(remarkInclude, {cwd: "..."})`.

If no directory is supplied the current working directory will be used.

### Glob patterns

It is possible to use glob patterns to include multiple files (e.g. via `@include chapters/*.md`); to enable glob patterns, call `use(remarkInclude, {glob: true})`

### Escaped paths

Formatters like prettier might escape characters inside an include statement, e.g. `@include chapters/\*.md`

To correct for these escapes, call `use(remarkInclude, {escaped: true})`

## License (MIT)

Copyright (c) 2016 Stephen Belanger

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
