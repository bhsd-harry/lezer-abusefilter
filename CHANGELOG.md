<!-- markdownlint-disable first-line-h1 -->
## 0.5.0

*2026-07-12*

**Added**

- [Signature help](./README.md#signature-help) for built-in functions

**Fixed**

- Duplicate [hover tooltips](./README.md#hover-tooltips) if `getHoverTooltip()` is called multiple times
- Built-in variables are case-insensitive while functions are case-sensitive

**Changed**

- Default [hover tooltips](./README.md#hover-tooltips) are shortened

## 0.4.1

*2026-06-12*

**Changed**

- [Hover tooltips](./README.md#hover-tooltips) are now displayed above the hovered tokens

## 0.4.0

*2026-06-01*

**Changed**

- [CodeMirror 6](https://codemirror.net/) packages are now peer dependencies

## 0.3.2

*2026-05-20*

**Changed**

- Upgrade dev dependencies to resolve version conflicts

## 0.3.1

*2026-04-23*

**Fixed**

- [Hover tooltips](./README.md#hover-tooltips) were not shown for built-in variables and functions in some cases

## 0.3.0

*2026-04-22*

**Added**

- The [lint source](./README.md#lint-source) now reports errors of unused local variables, invalid first arguments of the `set` and `set_var` functions, missing arguments of function calls, and negative array indices
- [Hover tooltips](./README.md#hover-tooltips) for built-in variables and functions
- JSDoc annotations for exported functions

## 0.2.0

*2026-03-18*

**Changed**

- Relational keywords (e.g., `like` and `in`) are now dynamically specified

## 0.1.2

*2026-01-22*

**Fixed**

- The [lint source](./README.md#lint-source) will not report false positives related to number-like identifiers (e.g., `0b02`) any more

## 0.1.1

*2026-01-20*

**Added**

- The [lint source](./README.md#lint-source) now reports errors related to incorrect use of internal variables and functions

**Fixed**

- Missing highlighting style for number literals

## 0.1.0

*2026-01-19*

**Added**

- New [lint source](./README.md#lint-source)

## 0.0.0

*2026-01-18*

- Initial release
