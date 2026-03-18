# @bhsd/lezer-abusefilter

[![npm version](https://badge.fury.io/js/@bhsd%2Flezer-abusefilter.svg)](https://www.npmjs.com/package/@bhsd/lezer-abusefilter)
[![CodeQL](https://github.com/bhsd-harry/lezer-abusefilter/actions/workflows/codeql.yml/badge.svg)](https://github.com/bhsd-harry/lezer-abusefilter/actions/workflows/codeql.yml)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/17892ba88e5a4e689d0266424689bc92)](https://app.codacy.com/gh/bhsd-harry/lezer-abusefilter/dashboard)

This repository contains [CodeMirror 6](https://codemirror.net/6/) language support for [MediaWiki AbuseFilter syntax](https://www.mediawiki.org/wiki/Extension:AbuseFilter/Rules_format). Here is an online [demo](https://bhsd-harry.github.io/lezer-abusefilter/), with syntax highlighting, indentation, autocompletion, and code folding.

## Installation

You can install the package via npm and import it as a module:

```bash
npm install @bhsd/lezer-abusefilter
```

## Language Support

It is recommended to dynamically generate [language support](https://codemirror.net/docs/ref/#language.LanguageSupport) for MediaWiki AbuseFilter with lists of predefined [keywords](https://www.mediawiki.org/wiki/Extension:AbuseFilter/Rules_format#Keywords), [variables](https://www.mediawiki.org/wiki/Extension:AbuseFilter/Rules_format#Variables_from_AbuseFilter) and [functions](https://www.mediawiki.org/wiki/Extension:AbuseFilter/Rules_format#Functions) from [Extension:AbuseFilter](https://www.mediawiki.org/wiki/Extension:AbuseFilter). These lists will be used for better syntax highlighting and autocompletion.

```ts
import {abusefilter} from '@bhsd/lezer-abusefilter';
import type {LanguageSupport} from '@codemirror/language';

const langSupport: LanguageSupport = abusefilter({
	keywords: [],
	functions: [],
	variables: [],
	deprecated: [], // List of deprecated variables
	disabled: [], // List of disabled functions
});
```

## Language

You can also import the [LR language](https://codemirror.net/docs/ref/#language.LRLanguage) for MediaWiki AbuseFilter alone. However, this will not include any predefined variables or functions for autocompletion.

```ts
import {abusefilterLanguage} from '@bhsd/lezer-abusefilter';
```

## Lint Source

This package also provides a [lint source](https://codemirror.net/docs/ref/#lint.LintSource) adapted from [AbuseFilter analyzer](https://meta.wikimedia.org/wiki/User:Msz2001/AbuseFilter_analyzer) for syntax checking.

Extension:AbuseFilter also provides an [API endpoint](https://www.mediawiki.org/w/api.php?action=help&modules=abusefilterchecksyntax) for syntax checking, but it requires permission to access and the error messages are sometimes not very informative. However, it can provide full linting of PCRE regular expressions, which is not perfectly supported by [AbuseFilter analyzer](https://github.com/marcinszwarc/abusefilter-analyzer?tab=readme-ov-file#known-limitations).

```ts
import {analyzer} from '@bhsd/lezer-abusefilter';
```
