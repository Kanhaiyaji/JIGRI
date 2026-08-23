export interface Language {
  id: string;
  name: string;
  monacoLang: string;
  extension: string;
  type: 'compiled' | 'interpreted' | 'web' | 'data';
  defaultCode: string;
  group: string;
  emoji: string;
}

export const languages: Language[] = [
  // Interpreted
  {
    id: 'python',
    name: 'Python 3.11',
    monacoLang: 'python',
    extension: 'py',
    type: 'interpreted',
    group: 'Interpreted',
    emoji: '🐍',
    defaultCode: `# Python 3.11
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("JIGRI"))
`,
  },
  {
    id: 'javascript',
    name: 'JavaScript (Node 20)',
    monacoLang: 'javascript',
    extension: 'js',
    type: 'interpreted',
    group: 'Interpreted',
    emoji: '🟨',
    defaultCode: `// JavaScript
const greet = (name) => \`Hello, \${name}!\`;
console.log(greet("JIGRI"));
`,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    monacoLang: 'typescript',
    extension: 'ts',
    type: 'interpreted',
    group: 'Interpreted',
    emoji: '🔷',
    defaultCode: `// TypeScript
const greet = (name: string): string => \`Hello, \${name}!\`;
console.log(greet("JIGRI"));
`,
  },
  {
    id: 'ruby',
    name: 'Ruby 3.3',
    monacoLang: 'ruby',
    extension: 'rb',
    type: 'interpreted',
    group: 'Interpreted',
    emoji: '💎',
    defaultCode: `# Ruby
def greet(name)
  "Hello, #{name}!"
end

puts greet("JIGRI")
`,
  },
  {
    id: 'php',
    name: 'PHP 8.3',
    monacoLang: 'php',
    extension: 'php',
    type: 'interpreted',
    group: 'Interpreted',
    emoji: '🐘',
    defaultCode: `<?php
function greet(string $name): string {
    return "Hello, $name!";
}

echo greet("JIGRI") . "\\n";
`,
  },
  {
    id: 'bash',
    name: 'Bash',
    monacoLang: 'shell',
    extension: 'sh',
    type: 'interpreted',
    group: 'Interpreted',
    emoji: '🐚',
    defaultCode: `#!/bin/bash
greet() {
  echo "Hello, $1!"
}

greet "JIGRI"
`,
  },
  // Compiled
  {
    id: 'cpp',
    name: 'C++ 17',
    monacoLang: 'cpp',
    extension: 'cpp',
    type: 'compiled',
    group: 'Compiled',
    emoji: '⚙️',
    defaultCode: `#include <iostream>
#include <string>
using namespace std;

string greet(const string& name) {
    return "Hello, " + name + "!";
}

int main() {
    cout << greet("JIGRI") << endl;
    return 0;
}
`,
  },
  {
    id: 'c',
    name: 'C 11',
    monacoLang: 'c',
    extension: 'c',
    type: 'compiled',
    group: 'Compiled',
    emoji: '🔧',
    defaultCode: `#include <stdio.h>

int main() {
    printf("Hello, JIGRI!\\n");
    return 0;
}
`,
  },
  {
    id: 'java',
    name: 'Java 21',
    monacoLang: 'java',
    extension: 'java',
    type: 'compiled',
    group: 'Compiled',
    emoji: '☕',
    defaultCode: `public class Main {
    static String greet(String name) {
        return "Hello, " + name + "!";
    }

    public static void main(String[] args) {
        System.out.println(greet("JIGRI"));
    }
}
`,
  },
  {
    id: 'go',
    name: 'Go 1.22',
    monacoLang: 'go',
    extension: 'go',
    type: 'compiled',
    group: 'Compiled',
    emoji: '🐹',
    defaultCode: `package main

import "fmt"

func greet(name string) string {
	return "Hello, " + name + "!"
}

func main() {
	fmt.Println(greet("JIGRI"))
}
`,
  },
  {
    id: 'rust',
    name: 'Rust 1.78',
    monacoLang: 'rust',
    extension: 'rs',
    type: 'compiled',
    group: 'Compiled',
    emoji: '🦀',
    defaultCode: `fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    println!("{}", greet("JIGRI"));
}
`,
  },
  // Web
  {
    id: 'html',
    name: 'HTML/CSS/JS',
    monacoLang: 'html',
    extension: 'html',
    type: 'web',
    group: 'Web',
    emoji: '🌐',
    defaultCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>JIGRI Preview</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #0d0f17, #1e1b4b);
      color: white;
    }
    h1 { font-size: 3rem; }
    span { color: #818cf8; }
  </style>
</head>
<body>
  <h1>Hello, <span>JIGRI</span>!</h1>
  <script>
    console.log("Hello from JavaScript!");
  </script>
</body>
</html>
`,
  },
  {
    id: 'markdown',
    name: 'Markdown',
    monacoLang: 'markdown',
    extension: 'md',
    type: 'web',
    group: 'Web',
    emoji: '📝',
    defaultCode: `# Welcome to JIGRI

**JIGRI** is a cloud-based online compiler and Python notebook platform.

## Features

- ✅ 20+ programming languages
- ✅ Python notebook with persistent runtime
- ✅ Remote Docker execution
- ✅ No local install required

## Code Example

\`\`\`python
print("Hello, JIGRI!")
\`\`\`

> Code in the cloud. No setup required.
`,
  },
];

export const languageMap = Object.fromEntries(languages.map((l) => [l.id, l]));

export function getLanguage(id: string): Language {
  return languageMap[id] ?? languages.find((l) => l.id === 'javascript')!;
}

export function getLanguageGroups(): Record<string, Language[]> {
  return languages.reduce<Record<string, Language[]>>((acc, lang) => {
    if (!acc[lang.group]) acc[lang.group] = [];
    acc[lang.group].push(lang);
    return acc;
  }, {});
}
