export interface CodeExample {
  id: string;
  title: string;
  description: string;
  category: string;
  code: string;
  instruction: string;
  tags: string[];
}

// Function to load examples from JSON files
async function loadExample(id: string): Promise<CodeExample | null> {
  try {
    const response = await fetch(`/examples/${id}.json`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error loading example ${id}:`, error);
    return null;
  }
}

// List of available example IDs
const availableExamples = [
  'hello-world',
  'variables',
  'constants-iota',
  'control-flow', 
  'functions-advanced',
  'error-handling',
  'structs-methods',
  'interfaces-basics',
  'arrays-slices',
  'maps-operations',
  'strings-text'
];

// Cache for loaded examples
const exampleCache = new Map<string, CodeExample>();

// Load all examples
export async function loadAllExamples(): Promise<CodeExample[]> {
  const examples: CodeExample[] = [];
  
  for (const id of availableExamples) {
    if (exampleCache.has(id)) {
      examples.push(exampleCache.get(id)!);
      continue;
    }
    
    const example = await loadExample(id);
    if (example) {
      exampleCache.set(id, example);
      examples.push(example);
    }
  }
  
  return examples;
}

// Fallback examples (for compatibility and development)
export const codeExamples: CodeExample[] = [
  {
    id: 'hello-world',
    title: 'Hello World',
    description: 'First program in Go',
    category: 'Basics',
    code: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    fmt.Println("Welcome to Go!")
}`,
    instruction: `# Hello World in Go

This is the first program you should learn in Go!

## How it works:

- **package main**: Defines that this is an executable program
- **import "fmt"**: Imports the formatting package
- **func main()**: Main function of the program
- **fmt.Println()**: Prints text to the console`,
    tags: ['basic', 'first', 'hello']
  },
  {
    id: 'variables',
    title: 'Variables',
    description: 'How to declare and use variables',
    category: 'Basics',
    instruction: `# Variables in Go

Go offers several ways to declare variables.

## Declaration forms:

1. **var name type = value**
2. **var name = value** (inferred type)
3. **name := value** (short declaration)
4. **var a, b, c type = val1, val2, val3**`,
    code: `package main

import "fmt"

func main() {
    // Declaration with var (explicit type)
    var name string = "Maria"
    var age int = 25
    
    // Declaration with var (inferred type)
    var city = "New York"
    var active = true
    
    // Short declaration
    height := 1.75
    weight := 70.5
    
    // Multiple variables
    var a, b, c int = 1, 2, 3
    x, y := 10, 20
    
    fmt.Println("Name:", name)
    fmt.Println("Age:", age)
    fmt.Println("City:", city)
    fmt.Println("Active:", active)
    fmt.Println("Height:", height)
    fmt.Printf("BMI: %.2f\n", weight/(height*height))
    fmt.Println("Numbers:", a, b, c)
    fmt.Println("Coordinates:", x, y)
}`,

    tags: ['variables', 'var', 'declaration', 'types']
  }
];

export const categories = [
  'All',
  'Basics',
  'Control',
  'Types',
  'Functions',
  'Concurrency',
  'Advanced'
];

export function searchExamples(examples: CodeExample[], query: string, category: string = 'All'): CodeExample[] {
  let filtered = examples;
  
  if (category !== 'All') {
    filtered = filtered.filter(example => example.category === category);
  }
  
  if (query.trim()) {
    const searchTerm = query.toLowerCase();
    filtered = filtered.filter(example =>
      example.title.toLowerCase().includes(searchTerm) ||
      example.description.toLowerCase().includes(searchTerm) ||
      example.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      example.code.toLowerCase().includes(searchTerm) ||
      example.instruction.toLowerCase().includes(searchTerm)
    );
  }
  
  return filtered;
}