import * as monaco from 'monaco-editor';

// Go standard library packages and their functions
export const goStdLib = {
  fmt: {
    functions: [
      { label: 'Print', insertText: 'Print(${1:a})', detail: 'func Print(a ...interface{}) (n int, err error)' },
      { label: 'Printf', insertText: 'Printf("${1:%v}", ${2:a})', detail: 'func Printf(format string, a ...interface{}) (n int, err error)' },
      { label: 'Println', insertText: 'Println(${1:a})', detail: 'func Println(a ...interface{}) (n int, err error)' },
      { label: 'Sprint', insertText: 'Sprint(${1:a})', detail: 'func Sprint(a ...interface{}) string' },
      { label: 'Sprintf', insertText: 'Sprintf("${1:%v}", ${2:a})', detail: 'func Sprintf(format string, a ...interface{}) string' },
      { label: 'Sprintln', insertText: 'Sprintln(${1:a})', detail: 'func Sprintln(a ...interface{}) string' },
      { label: 'Fprint', insertText: 'Fprint(${1:w}, ${2:a})', detail: 'func Fprint(w io.Writer, a ...interface{}) (n int, err error)' },
      { label: 'Fprintf', insertText: 'Fprintf(${1:w}, "${2:%v}", ${3:a})', detail: 'func Fprintf(w io.Writer, format string, a ...interface{}) (n int, err error)' },
      { label: 'Fprintln', insertText: 'Fprintln(${1:w}, ${2:a})', detail: 'func Fprintln(w io.Writer, a ...interface{}) (n int, err error)' },
      { label: 'Scan', insertText: 'Scan(&${1:a})', detail: 'func Scan(a ...interface{}) (n int, err error)' },
      { label: 'Scanf', insertText: 'Scanf("${1:%v}", &${2:a})', detail: 'func Scanf(format string, a ...interface{}) (n int, err error)' },
      { label: 'Scanln', insertText: 'Scanln(&${1:a})', detail: 'func Scanln(a ...interface{}) (n int, err error)' },
      { label: 'Errorf', insertText: 'Errorf("${1:error}: %v", ${2:err})', detail: 'func Errorf(format string, a ...interface{}) error' },
    ]
  },
  strings: {
    functions: [
      { label: 'Contains', insertText: 'Contains(${1:s}, ${2:substr})', detail: 'func Contains(s, substr string) bool' },
      { label: 'ContainsAny', insertText: 'ContainsAny(${1:s}, ${2:chars})', detail: 'func ContainsAny(s, chars string) bool' },
      { label: 'Count', insertText: 'Count(${1:s}, ${2:substr})', detail: 'func Count(s, substr string) int' },
      { label: 'HasPrefix', insertText: 'HasPrefix(${1:s}, ${2:prefix})', detail: 'func HasPrefix(s, prefix string) bool' },
      { label: 'HasSuffix', insertText: 'HasSuffix(${1:s}, ${2:suffix})', detail: 'func HasSuffix(s, suffix string) bool' },
      { label: 'Index', insertText: 'Index(${1:s}, ${2:substr})', detail: 'func Index(s, substr string) int' },
      { label: 'Join', insertText: 'Join(${1:elems}, "${2:sep}")', detail: 'func Join(elems []string, sep string) string' },
      { label: 'Replace', insertText: 'Replace(${1:s}, "${2:old}", "${3:new}", ${4:-1})', detail: 'func Replace(s, old, new string, n int) string' },
      { label: 'ReplaceAll', insertText: 'ReplaceAll(${1:s}, "${2:old}", "${3:new}")', detail: 'func ReplaceAll(s, old, new string) string' },
      { label: 'Split', insertText: 'Split(${1:s}, "${2:sep}")', detail: 'func Split(s, sep string) []string' },
      { label: 'ToLower', insertText: 'ToLower(${1:s})', detail: 'func ToLower(s string) string' },
      { label: 'ToUpper', insertText: 'ToUpper(${1:s})', detail: 'func ToUpper(s string) string' },
      { label: 'Trim', insertText: 'Trim(${1:s}, "${2:cutset}")', detail: 'func Trim(s, cutset string) string' },
      { label: 'TrimSpace', insertText: 'TrimSpace(${1:s})', detail: 'func TrimSpace(s string) string' },
    ]
  },
  strconv: {
    functions: [
      { label: 'Atoi', insertText: 'Atoi(${1:s})', detail: 'func Atoi(s string) (int, error)' },
      { label: 'Itoa', insertText: 'Itoa(${1:i})', detail: 'func Itoa(i int) string' },
      { label: 'ParseBool', insertText: 'ParseBool(${1:str})', detail: 'func ParseBool(str string) (bool, error)' },
      { label: 'ParseFloat', insertText: 'ParseFloat(${1:s}, ${2:64})', detail: 'func ParseFloat(s string, bitSize int) (float64, error)' },
      { label: 'ParseInt', insertText: 'ParseInt(${1:s}, ${2:10}, ${3:64})', detail: 'func ParseInt(s string, base int, bitSize int) (int64, error)' },
      { label: 'FormatBool', insertText: 'FormatBool(${1:b})', detail: 'func FormatBool(b bool) string' },
      { label: 'FormatFloat', insertText: 'FormatFloat(${1:f}, ${2:\'f\'}, ${3:-1}, ${4:64})', detail: 'func FormatFloat(f float64, fmt byte, prec, bitSize int) string' },
      { label: 'FormatInt', insertText: 'FormatInt(${1:i}, ${2:10})', detail: 'func FormatInt(i int64, base int) string' },
    ]
  },
  time: {
    functions: [
      { label: 'Now', insertText: 'Now()', detail: 'func Now() Time' },
      { label: 'Sleep', insertText: 'Sleep(${1:1} * time.Second)', detail: 'func Sleep(d Duration)' },
      { label: 'Since', insertText: 'Since(${1:t})', detail: 'func Since(t Time) Duration' },
      { label: 'Until', insertText: 'Until(${1:t})', detail: 'func Until(t Time) Duration' },
      { label: 'Parse', insertText: 'Parse("${1:2006-01-02}", "${2:2024-01-01}")', detail: 'func Parse(layout, value string) (Time, error)' },
      { label: 'NewTicker', insertText: 'NewTicker(${1:1} * time.Second)', detail: 'func NewTicker(d Duration) *Ticker' },
      { label: 'NewTimer', insertText: 'NewTimer(${1:1} * time.Second)', detail: 'func NewTimer(d Duration) *Timer' },
      { label: 'After', insertText: 'After(${1:1} * time.Second)', detail: 'func After(d Duration) <-chan Time' },
    ],
    constants: [
      { label: 'Second', insertText: 'Second', detail: 'const Second Duration = 1000000000' },
      { label: 'Minute', insertText: 'Minute', detail: 'const Minute = 60 * Second' },
      { label: 'Hour', insertText: 'Hour', detail: 'const Hour = 60 * Minute' },
    ]
  },
  math: {
    functions: [
      { label: 'Abs', insertText: 'Abs(${1:x})', detail: 'func Abs(x float64) float64' },
      { label: 'Ceil', insertText: 'Ceil(${1:x})', detail: 'func Ceil(x float64) float64' },
      { label: 'Floor', insertText: 'Floor(${1:x})', detail: 'func Floor(x float64) float64' },
      { label: 'Max', insertText: 'Max(${1:x}, ${2:y})', detail: 'func Max(x, y float64) float64' },
      { label: 'Min', insertText: 'Min(${1:x}, ${2:y})', detail: 'func Min(x, y float64) float64' },
      { label: 'Pow', insertText: 'Pow(${1:x}, ${2:y})', detail: 'func Pow(x, y float64) float64' },
      { label: 'Round', insertText: 'Round(${1:x})', detail: 'func Round(x float64) float64' },
      { label: 'Sqrt', insertText: 'Sqrt(${1:x})', detail: 'func Sqrt(x float64) float64' },
    ]
  },
  os: {
    functions: [
      { label: 'Exit', insertText: 'Exit(${1:0})', detail: 'func Exit(code int)' },
      { label: 'Getenv', insertText: 'Getenv("${1:key}")', detail: 'func Getenv(key string) string' },
      { label: 'Setenv', insertText: 'Setenv("${1:key}", "${2:value}")', detail: 'func Setenv(key, value string) error' },
      { label: 'Open', insertText: 'Open("${1:name}")', detail: 'func Open(name string) (*File, error)' },
      { label: 'Create', insertText: 'Create("${1:name}")', detail: 'func Create(name string) (*File, error)' },
      { label: 'Remove', insertText: 'Remove("${1:name}")', detail: 'func Remove(name string) error' },
      { label: 'Mkdir', insertText: 'Mkdir("${1:name}", ${2:0755})', detail: 'func Mkdir(name string, perm FileMode) error' },
    ],
    variables: [
      { label: 'Args', insertText: 'Args', detail: 'var Args []string' },
      { label: 'Stdout', insertText: 'Stdout', detail: 'var Stdout = NewFile(uintptr(syscall.Stdout), "/dev/stdout")' },
      { label: 'Stderr', insertText: 'Stderr', detail: 'var Stderr = NewFile(uintptr(syscall.Stderr), "/dev/stderr")' },
      { label: 'Stdin', insertText: 'Stdin', detail: 'var Stdin = NewFile(uintptr(syscall.Stdin), "/dev/stdin")' },
    ]
  }
};

// Go keywords for additional suggestions
export const goKeywords = [
  'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else',
  'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface',
  'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type', 'var'
];

// Go types
export const goTypes = [
  'bool', 'byte', 'complex64', 'complex128', 'error', 'float32', 'float64',
  'int', 'int8', 'int16', 'int32', 'int64', 'rune', 'string',
  'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr'
];

// Code snippets
export const goSnippets = [
  {
    label: 'main',
    insertText: 'func main() {\n\t${1}\n}',
    detail: 'Main function'
  },
  {
    label: 'for',
    insertText: 'for ${1:i} := ${2:0}; ${1:i} < ${3:10}; ${1:i}++ {\n\t${4}\n}',
    detail: 'For loop'
  },
  {
    label: 'forrange',
    insertText: 'for ${1:index}, ${2:value} := range ${3:slice} {\n\t${4}\n}',
    detail: 'For range loop'
  },
  {
    label: 'if',
    insertText: 'if ${1:condition} {\n\t${2}\n}',
    detail: 'If statement'
  },
  {
    label: 'iferr',
    insertText: 'if err != nil {\n\t${1:return err}\n}',
    detail: 'Error check'
  },
  {
    label: 'func',
    insertText: 'func ${1:name}(${2:params}) ${3:returnType} {\n\t${4}\n}',
    detail: 'Function declaration'
  },
  {
    label: 'struct',
    insertText: 'type ${1:Name} struct {\n\t${2:field} ${3:type}\n}',
    detail: 'Struct declaration'
  },
  {
    label: 'interface',
    insertText: 'type ${1:Name} interface {\n\t${2:Method}() ${3:returnType}\n}',
    detail: 'Interface declaration'
  },
  {
    label: 'switch',
    insertText: 'switch ${1:expression} {\ncase ${2:value}:\n\t${3}\ndefault:\n\t${4}\n}',
    detail: 'Switch statement'
  },
  {
    label: 'select',
    insertText: 'select {\ncase ${1:channel} <- ${2:value}:\n\t${3}\ndefault:\n\t${4}\n}',
    detail: 'Select statement'
  },
  {
    label: 'goroutine',
    insertText: 'go func() {\n\t${1}\n}()',
    detail: 'Goroutine'
  },
  {
    label: 'defer',
    insertText: 'defer ${1:func()}',
    detail: 'Defer statement'
  },
  {
    label: 'make',
    insertText: 'make(${1:[]type}, ${2:0})',
    detail: 'Make slice/map/channel'
  },
  {
    label: 'append',
    insertText: 'append(${1:slice}, ${2:element})',
    detail: 'Append to slice'
  }
];

export function setupGoIntellisense(monaco: typeof import('monaco-editor')) {
  // Register completion provider
  monaco.languages.registerCompletionItemProvider('go', {
    triggerCharacters: ['.'],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });

      const suggestions: any[] = [];

      // Check if we're after a package name with a dot
      const packageMatch = textUntilPosition.match(/(\w+)\.$/);
      if (packageMatch) {
        const packageName = packageMatch[1];
        const stdlib = goStdLib[packageName as keyof typeof goStdLib];
        
        if (stdlib) {
          // Add functions from the package
          if (stdlib.functions) {
            stdlib.functions.forEach(func => {
              suggestions.push({
                label: func.label,
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: func.insertText,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: func.detail,
                range: range
              });
            });
          }
          
          // Add constants/variables if they exist
          if ((stdlib as any).constants) {
            (stdlib as any).constants.forEach((constant: any) => {
              suggestions.push({
                label: constant.label,
                kind: monaco.languages.CompletionItemKind.Constant,
                insertText: constant.insertText,
                detail: constant.detail,
                range: range
              });
            });
          }
          
          if ((stdlib as any).variables) {
            (stdlib as any).variables.forEach((variable: any) => {
              suggestions.push({
                label: variable.label,
                kind: monaco.languages.CompletionItemKind.Variable,
                insertText: variable.insertText,
                detail: variable.detail,
                range: range
              });
            });
          }
        }
      } else {
        // General suggestions when not after a package name
        
        // Add snippets
        goSnippets.forEach(snippet => {
          suggestions.push({
            label: snippet.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: snippet.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: snippet.detail,
            range: range
          });
        });

        // Add keywords
        goKeywords.forEach(keyword => {
          suggestions.push({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range
          });
        });

        // Add types
        goTypes.forEach(type => {
          suggestions.push({
            label: type,
            kind: monaco.languages.CompletionItemKind.TypeParameter,
            insertText: type,
            range: range
          });
        });

        // Add package names for import
        Object.keys(goStdLib).forEach(pkg => {
          suggestions.push({
            label: pkg,
            kind: monaco.languages.CompletionItemKind.Module,
            insertText: pkg,
            detail: `Package ${pkg}`,
            range: range
          });
        });
      }

      return { suggestions };
    }
  });

  // Register hover provider for documentation
  monaco.languages.registerHoverProvider('go', {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      // Check if it's a known function
      for (const [pkgName, pkg] of Object.entries(goStdLib)) {
        if (pkg.functions) {
          const func = pkg.functions.find(f => f.label === word.word);
          if (func) {
            return {
              contents: [
                { value: `**${pkgName}.${func.label}**` },
                { value: func.detail }
              ]
            };
          }
        }
      }

      // Check if it's a keyword
      if (goKeywords.includes(word.word)) {
        return {
          contents: [{ value: `**${word.word}** (keyword)` }]
        };
      }

      // Check if it's a type
      if (goTypes.includes(word.word)) {
        return {
          contents: [{ value: `**${word.word}** (built-in type)` }]
        };
      }

      return null;
    }
  });
}