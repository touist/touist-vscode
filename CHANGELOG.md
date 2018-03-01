# Change Log
All notable changes to the touist tmLanguage files will be logged here.

## 0.1.0
- add linting. The touist.touistPath can be given in order to set the path
  to touist.

## 0.0.9
- Fixed extension that could not be installed on vscode because of an unexisting
  dependendy 'latex-preview'.

## 0.0.8
- Fixed coloration of variables tuples (e.g., `$var(a,b)`)

## 0.0.7
- The main file extension for saving a touist file is now `.touist` instead
  of `.touistl`

## 0.0.6
- fix image not displaying in README

## 0.0.5
- support for 'for ... in ...' in exists and forall operators
- support for '\\' (newline) in formulas
- added a screenshot in the README

## 0.0.4
- added many missing keywords (if then else exists forall diff...) and
  improved overall syntax parsing.

## 0.0.3
- added support for parsing output from tasks (problemMatcher '$touist').
  Unfortunaltely, only the message in the first line of errors is catched
  by it (the multi-line messages is a feature request in vscode)

## 0.0.2
- added an icon to the project

## 0.0.1
- Initial release
