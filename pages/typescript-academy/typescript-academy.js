// --- TypeScript Academy Curriculum Data ---
const curriculum = [
    {
        id: "basic-types",
        title: "Basic Types & Type Inference",
        lessons: [
            {
                id: "basic-types-1",
                title: "Primitive Types & Annotations",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Getting Started with TypeScript</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">TypeScript adds <strong>static type checking</strong> to JavaScript. The core primitive types are <code>string</code>, <code>number</code>, and <code>boolean</code>. You annotate variables with a colon followed by the type.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">TypeScript can also <strong>infer</strong> types automatically from the assigned value, so explicit annotations are optional when the value makes the type obvious.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Other primitives include <code>null</code>, <code>undefined</code>, <code>symbol</code>, and <code>bigint</code>. Use <code>any</code> to opt out of type checking (avoid when possible).</p>
                    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
                        <p class="text-blue-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i>Head to the <strong>Playground & Code</strong> tab and click "Run Code" to see TypeScript in action!</p>
                    </div>
                `,
                defaultCode: `// --- Basic Types & Type Inference ---

// Explicit type annotations
let username: string = "Alice";
let age: number = 25;
let isActive: boolean = true;

// Type inference (TypeScript infers the type)
let city = "New York";       // inferred as string
let score = 95;              // inferred as number
let enrolled = true;         // inferred as boolean

// Arrays
let skills: string[] = ["TypeScript", "React", "Node.js"];
let numbers: Array<number> = [1, 2, 3, 4, 5];

// Tuple
let pair: [string, number] = ["age", 25];

// Any (avoid when possible)
let flexible: any = "hello";
flexible = 42;

// Output
console.log("User:", username);
console.log("City:", city);
console.log("Skills:", skills.join(", "));
console.log("Tuple:", pair);`
            },
            {
                id: "basic-types-2",
                title: "Type Inference in Practice",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">How TypeScript Infers Types</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">TypeScript's type inference analyzes the initial value and context to determine types automatically. This reduces boilerplate while maintaining safety.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Key inference scenarios:</p>
                    <ul class="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                        <li><strong>Variable initialization:</strong> <code>let x = 10</code> infers <code>number</code></li>
                        <li><strong>Return types:</strong> Functions infer return types from their return statements</li>
                        <li><strong>Contextual typing:</strong> Callbacks and event handlers infer parameter types from context</li>
                    </ul>
                    <p class="mb-4 text-gray-700 leading-relaxed">Use explicit annotations when inference isn't precise enough, like for function parameters and complex structures.</p>
                `,
                defaultCode: `// --- Type Inference Examples ---

// Return type inference
function add(a: number, b: number) {
    return a + b;  // TypeScript infers return type as number
}

// Contextual typing with array methods
const doubled = [1, 2, 3, 4].map(n => n * 2);  // n inferred as number

// Best common type
const mixedArray = [10, "hello", true];  // inferred as (string | number | boolean)[]

// Literal type inference
const CONSTANT = "hello";      // inferred as "hello" (literal)
let variable = "hello";        // inferred as string (widened)

// Function parameter types (always annotate these)
function greet(name: string): string {
    return \`Hello, \${name}!\`;
}

console.log(add(5, 3));
console.log("Doubled:", doubled);
console.log("Mixed:", mixedArray);
console.log(greet("TypeScript"));`
            }
        ],
        quiz: [
            {
                id: "q-basic-1",
                question: "Which keyword is used to opt out of type checking in TypeScript?",
                options: ["unknown", "any", "void", "never"],
                correct: 1
            },
            {
                id: "q-basic-2",
                question: "What is the inferred type of `let x = [1, 'a', true]`?",
                options: ["any[]", "object[]", "(string | number | boolean)[]", "never[]"],
                correct: 2
            },
            {
                id: "q-basic-3",
                question: "When does TypeScript infer a literal type instead of widening it?",
                options: ["When using let", "When using const", "When using var", "When using function return"],
                correct: 1
            }
        ]
    },
    {
        id: "interfaces",
        title: "Interfaces & Type Aliases",
        lessons: [
            {
                id: "interfaces-1",
                title: "Defining Interfaces",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Shapes of Data with Interfaces</h3>
                    <p class="mb-4 text-gray-700 leading-relaxet">Interfaces define the <strong>shape</strong> of an object — the names and types of its properties. They are a core tool for enforcing structure in your TypeScript code.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Properties can be <strong>optional</strong> (marked with <code>?</code>), <strong>readonly</strong>, or use <strong>index signatures</strong> for dynamic keys. Interfaces can also describe function signatures and be extended.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Interfaces are <strong>open</strong> — they can be declared multiple times and merge their definitions (declaration merging).</p>
                `,
                defaultCode: `// --- Interfaces ---

interface User {
    readonly id: number;
    name: string;
    email: string;
    age?: number;           // optional property
    readonly createdAt: Date;
}

interface Admin extends User {
    role: "admin" | "superadmin";
    permissions: string[];
}

// Using interfaces
const user: User = {
    id: 1,
    name: "Alice",
    email: "alice@example.com",
    createdAt: new Date()
};

const admin: Admin = {
    id: 2,
    name: "Bob",
    email: "bob@example.com",
    createdAt: new Date(),
    role: "admin",
    permissions: ["read", "write", "delete"]
};

// Interface for function types
interface StringFormatter {
    (input: string, uppercase: boolean): string;
}

const format: StringFormatter = (input, upper) =>
    upper ? input.toUpperCase() : input.toLowerCase();

console.log("User:", user);
console.log("Admin:", admin.role);
console.log("Formatted:", format("hello TypeScript", true));`
            },
            {
                id: "interfaces-2",
                title: "Type Aliases & Differences",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Type vs Interface</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Type aliases</strong> (<code>type</code>) and interfaces share many capabilities, but have key differences:</p>
                    <ul class="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                        <li><strong>Interfaces</strong> support declaration merging; types don't</li>
                        <li><strong>Types</strong> can represent unions, intersections, primitives, and tuples more naturally</li>
                        <li><strong>Types</strong> use <code>&</code> for intersection; interfaces use <code>extends</code></li>
                        <li>Both support generics and can describe object shapes</li>
                    </ul>
                    <p class="mb-4 text-gray-700 leading-relaxed">Prefer <strong>interface</strong> for public API shapes (they're more extensible). Use <strong>type</strong> for complex unions, mapped types, or utility types.</p>
                `,
                defaultCode: `// --- Type Aliases vs Interfaces ---

// Type alias for primitives and unions
type ID = string | number;
type Status = "active" | "inactive" | "pending";

// Type alias for objects
type Point = {
    x: number;
    y: number;
};

// Intersection with type (vs extends with interfaces)
type Named = { name: string };
type Aged = { age: number };
type Person = Named & Aged;

// Type for function signatures
type Calculator = (a: number, b: number) => number;

const multiply: Calculator = (a, b) => a * b;

// Type for tuples
type Pair<T, U> = [T, U];
const entry: Pair<string, number> = ["key", 42];

// Practical example
type ApiResponse<T> = {
    data: T;
    status: Status;
    error?: string;
};

const response: ApiResponse<Person> = {
    data: { name: "Charlie", age: 30 },
    status: "active"
};

console.log("Point:", { x: 10, y: 20 });
console.log("Person:", { name: "Diana", age: 28 });
console.log("Multiply 6 * 7 =", multiply(6, 7));
console.log("API Response:", response);`
            }
        ],
        quiz: [
            {
                id: "q-interfaces-1",
                question: "Which feature is unique to interfaces and NOT available in type aliases?",
                options: ["Generics", "Optional properties", "Declaration merging", "Readonly properties"],
                correct: 2
            },
            {
                id: "q-interfaces-2",
                question: "How do you make a property optional in an interface?",
                options: ["Using the ? suffix", "Using the optional keyword", "Using | undefined", "Using the maybe keyword"],
                correct: 0
            }
        ]
    },
    {
        id: "generics",
        title: "Generics & Utility Types",
        lessons: [
            {
                id: "generics-1",
                title: "Generic Functions & Types",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Type-Safe Reusability with Generics</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Generics allow you to create <strong>reusable components</strong> that work with a variety of types rather than a single one. They're like type variables — captured when the function or class is used.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">You can add <strong>constraints</strong> with the <code>extends</code> keyword to limit what types are acceptable. This lets you access known properties while still being generic.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Generics apply to functions, classes, interfaces, and type aliases, enabling powerful type-safe abstractions.</p>
                `,
                defaultCode: `// --- Generics ---

// Generic function
function firstElement<T>(arr: T[]): T | undefined {
    return arr[0];
}

const firstNum = firstElement([1, 2, 3]);       // type: number
const firstStr = firstElement(["a", "b", "c"]); // type: string

// Generic interface
interface Box<T> {
    value: T;
    label: string;
}

const stringBox: Box<string> = { value: "hello", label: "Greeting" };
const numberBox: Box<number> = { value: 42, label: "Answer" };

// Generic with constraints
interface HasLength {
    length: number;
}

function logLength<T extends HasLength>(item: T): T {
    console.log(\`Length: \${item.length}\`);
    return item;
}

logLength("Hello TypeScript");
logLength([1, 2, 3, 4, 5]);
// logLength(42);  // Error! number doesn't have .length

// Generic class
class Stack<T> {
    private items: T[] = [];

    push(item: T): void {
        this.items.push(item);
    }

    pop(): T | undefined {
        return this.items.pop();
    }
}

const numStack = new Stack<number>();
numStack.push(1);
numStack.push(2);
console.log("Popped:", numStack.pop());

console.log("First number:", firstNum);
console.log("String box:", stringBox);`
            },
            {
                id: "generics-2",
                title: "Built-in Utility Types",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">TypeScript's Built-in Type Transformations</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">TypeScript ships with powerful <strong>utility types</strong> that transform existing types into new ones. These save you from writing repetitive type definitions.</p>
                    <ul class="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                        <li><code>Partial&lt;T&gt;</code> — Makes all properties optional</li>
                        <li><code>Required&lt;T&gt;</code> — Makes all properties required</li>
                        <li><code>Pick&lt;T, K&gt;</code> — Selects specific properties</li>
                        <li><code>Omit&lt;T, K&gt;</code> — Removes specific properties</li>
                        <li><code>Record&lt;K, T&gt;</code> — Creates an object type with specific keys and values</li>
                        <li><code>Readonly&lt;T&gt;</code> — Makes all properties readonly</li>
                    </ul>
                `,
                defaultCode: `// --- Utility Types ---

interface Todo {
    title: string;
    description: string;
    completed: boolean;
    priority: number;
}

// Partial - all properties optional
const partialTodo: Partial<Todo> = {
    title: "Learn TypeScript"
};

// Pick - select specific properties
type TodoPreview = Pick<Todo, "title" | "completed">;
const preview: TodoPreview = {
    title: "Finish project",
    completed: false
};

// Omit - remove specific properties
type TodoWithoutDesc = Omit<Todo, "description">;
const brief: TodoWithoutDesc = {
    title: "Review code",
    completed: true,
    priority: 1
};

// Record - key-value mapping
type PageInfo = "home" | "about" | "contact";
const pageVisits: Record<PageInfo, number> = {
    home: 42,
    about: 15,
    contact: 8
};

// Readonly - immutable
const frozen: Readonly<Todo> = {
    title: "Frozen task",
    description: "Cannot be changed",
    completed: false,
    priority: 0
};

console.log("Partial:", partialTodo);
console.log("Preview:", preview);
console.log("Page visits:", pageVisits);
console.log("Frozen title:", frozen.title);`
            }
        ],
        quiz: [
            {
                id: "q-generics-1",
                question: "How do you constrain a generic type parameter to only types that have a specific property?",
                options: ["Using T extends InterfaceName", "Using T implements InterfaceName", "Using <T: InterfaceName>", "Using T where InterfaceName"],
                correct: 0
            },
            {
                id: "q-generics-2",
                question: "Which utility type makes all properties of T optional?",
                options: ["Optional<T>", "Nullable<T>", "Partial<T>", "Flexible<T>"],
                correct: 2
            }
        ]
    },
    {
        id: "enums-unions",
        title: "Enums & Unions",
        lessons: [
            {
                id: "enums-1",
                title: "Enums in TypeScript",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Named Constants with Enums</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Enums allow you to define a set of <strong>named constants</strong>. TypeScript supports both <strong>numeric</strong> and <strong>string</strong> enums.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Numeric enums auto-increment from 0 by default. String enums must have explicit values. Use <code>const enum</code> to avoid runtime overhead — the values are inlined at compile time.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Enums are useful for representing fixed sets of options like directions, statuses, or categories.</p>
                `,
                defaultCode: `// --- Enums ---

// Numeric enum (auto-increments from 0)
enum Direction {
    North,   // 0
    East,    // 1
    South,   // 2
    West     // 3
}

// String enum
enum Status {
    Active = "ACTIVE",
    Inactive = "INACTIVE",
    Pending = "PENDING"
}

// Enum with custom numeric values
enum HttpStatus {
    OK = 200,
    NotFound = 404,
    InternalError = 500
}

// Reverse mapping (numeric enums only)
console.log("Direction.North:", Direction.North);  // 0
console.log("Direction[0]:", Direction[0]);        // "North"

// Usage in functions
function respond(status: HttpStatus): string {
    return \`Response: \${status} (\${HttpStatus[status]})\`;
}

console.log(respond(HttpStatus.OK));
console.log("Status:", Status.Active);
console.log("All directions:", Object.values(Direction).filter(v => typeof v === 'number'));`
            },
            {
                id: "unions-1",
                title: "Union & Intersection Types",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Combining Types</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Union types</strong> (<code>|</code>) allow a value to be one of several types. They're ideal for handling flexible inputs, nullable values, and discriminated unions.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Intersection types</strong> (<code>&</code>) combine multiple types into one. The resulting type must satisfy all constituent types simultaneously.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Discriminated unions</strong> use a common literal property (the "discriminant") to narrow types within a union, enabling elegant pattern matching.</p>
                `,
                defaultCode: `// --- Union & Intersection Types ---

// Union types
type StringOrNumber = string | number;

function formatValue(value: StringOrNumber): string {
    if (typeof value === "string") {
        return \`String: \${value.toUpperCase()}\`;
    }
    return \`Number: \${value.toFixed(2)}\`;
}

// Intersection types
type HasName = { name: string };
type HasEmail = { email: string };
type Contact = HasName & HasEmail;

const contact: Contact = {
    name: "Eve",
    email: "eve@example.com"
};

// Discriminated unions
type Shape =
    | { kind: "circle"; radius: number }
    | { kind: "rectangle"; width: number; height: number }
    | { kind: "triangle"; base: number; height: number };

function area(shape: Shape): number {
    switch (shape.kind) {
        case "circle":
            return Math.PI * shape.radius ** 2;
        case "rectangle":
            return shape.width * shape.height;
        case "triangle":
            return (shape.base * shape.height) / 2;
    }
}

console.log(formatValue(42));
console.log(formatValue("hello"));
console.log("Contact:", contact);
console.log("Circle area:", area({ kind: "circle", radius: 5 }));
console.log("Rectangle area:", area({ kind: "rectangle", width: 4, height: 6 }));`
            }
        ],
        quiz: [
            {
                id: "q-enums-1",
                question: "What value does `Direction.West` have in `enum Direction { North, East, South, West }`?",
                options: ["3", "4", "West", "undefined"],
                correct: 0
            },
            {
                id: "q-enums-2",
                question: "What pattern uses a common property to narrow types within a union?",
                options: ["Type predicate", "Discriminated union", "Type assertion", "Branded type"],
                correct: 1
            }
        ]
    },
    {
        id: "classes-decorators",
        title: "Classes & Decorators",
        lessons: [
            {
                id: "classes-1",
                title: "TypeScript Classes",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Object-Oriented Programming with TypeScript</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">TypeScript enhances JavaScript classes with <strong>access modifiers</strong> (<code>public</code>, <code>private</code>, <code>protected</code>), <strong>readonly</strong> properties, <strong>parameter properties</strong> (shorthand constructor), and <strong>abstract classes</strong>.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Parameter properties let you declare and initialize class members directly in the constructor parameters, reducing boilerplate significantly.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Abstract classes serve as base classes that cannot be instantiated directly — they define a blueprint with abstract methods that subclasses must implement.</p>
                `,
                defaultCode: `// --- TypeScript Classes ---

// Access modifiers & parameter properties
class Person {
    constructor(
        public name: string,
        private ssn: string,
        protected age: number
    ) {}

    greet(): string {
        return \`Hi, I'm \${this.name}\`;
    }

    getSsn(): string {
        return \`***-\${this.ssn.slice(-4)}\`;
    }
}

// Inheritance
class Employee extends Person {
    constructor(
        name: string,
        ssn: string,
        age: number,
        public role: string
    ) {
        super(name, ssn, age);
    }

    work(): string {
        return \`\${this.name} works as \${this.role}\`;
    }
}

// Abstract class
abstract class Shape {
    constructor(public color: string) {}

    abstract getArea(): number;

    describe(): string {
        return \`A \${this.color} shape with area \${this.getArea()}\`;
    }
}

class Circle extends Shape {
    constructor(color: string, public radius: number) {
        super(color);
    }

    getArea(): number {
        return Math.PI * this.radius ** 2;
    }
}

const emp = new Employee("Alice", "123-45-6789", 30, "Engineer");
const circle = new Circle("blue", 5);

console.log(emp.greet());
console.log(emp.work());
console.log(emp.getSsn());
console.log(circle.describe());`
            },
            {
                id: "decorators-1",
                title: "Decorators",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Metaprogramming with Decorators</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Decorators are special declarations that can be attached to classes, methods, properties, and parameters. They're a <strong>stage 3 ECMAScript proposal</strong> and enabled via the <code>experimentalDecorators</code> compiler option.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Important flavors include <strong>class decorators</strong>, <strong>method decorators</strong>, and <strong>property decorators</strong>. They receive metadata about the decorated element and can modify behavior.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Frameworks like Angular and NestJS rely heavily on decorators for dependency injection, routing, and component configuration.</p>
                `,
                defaultCode: `// --- Decorators ---

// Simple class decorator
function sealed(constructor: Function) {
    Object.seal(constructor);
    Object.seal(constructor.prototype);
    console.log("Class sealed:", constructor.name);
}

// Method decorator
function logMethod(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
) {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
        console.log(\`Calling \${propertyKey} with args: \${JSON.stringify(args)}\`);
        const result = original.apply(this, args);
        console.log(\`\${propertyKey} returned: \${result}\`);
        return result;
    };
    return descriptor;
}

// Using decorators (enable experimentalDecorators in tsconfig)
// @sealed
class Calculator {
    // @logMethod
    add(a: number, b: number): number {
        return a + b;
    }

    // @logMethod
    multiply(a: number, b: number): number {
        return a * b;
    }
}

// Simulating decorator behavior manually
function withLogging(obj: any, methodName: string) {
    const original = obj[methodName];
    obj[methodName] = function (...args: any[]) {
        console.log(\`Log: \${methodName}(\${args.join(", ")})\`);
        return original.apply(this, args);
    };
}

const calc = new Calculator();
withLogging(calc, "add");
withLogging(calc, "multiply");

console.log("Result:", calc.add(5, 3));
console.log("Product:", calc.multiply(4, 7));`
            }
        ],
        quiz: [
            {
                id: "q-classes-1",
                question: "Which access modifier makes a property accessible only within the declaring class?",
                options: ["public", "private", "protected", "internal"],
                correct: 1
            },
            {
                id: "q-classes-2",
                question: "What compiler option enables decorator support?",
                options: ["strictDecorators", "experimentalDecorators", "emitDecoratorMetadata", "decoratorSupport"],
                correct: 1
            }
        ]
    },
    {
        id: "modules",
        title: "Modules & Namespaces",
        lessons: [
            {
                id: "modules-1",
                title: "ES Modules in TypeScript",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Organizing Code with Modules</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">TypeScript follows the <strong>ES Module</strong> standard, using <code>import</code> and <code>export</code> keywords. Every file with top-level <code>import</code> or <code>export</code> is treated as a module.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">You can import types separately using <code>import type</code>, which ensures the import is erased at runtime — useful for avoiding circular dependencies and smaller bundles.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Key module patterns: named exports, default exports, re-exports (<code>export * from</code>), and barrel files (<code>index.ts</code>).</p>
                `,
                defaultCode: `// --- Modules (simulated in playground) ---

// Normally these would be in separate files
// math.ts
export function add(a: number, b: number): number {
    return a + b;
}

export function multiply(a: number, b: number): number {
    return a * b;
}

export const PI = 3.14159;

// Default export
export default class Logger {
    log(message: string): void {
        console.log("[Log]:", message);
    }
}

// Types export
export type UserID = string | number;

export interface Config {
    debug: boolean;
    version: string;
}

// Importing (simulated inline)
function simulateModuleUsage() {
    // Named imports
    const { add: addFn, multiply: mulFn, PI: pi } = { add, multiply, PI };

    // Default import usage
    const logger = new Logger();
    logger.log("Module system initialized");

    // Using Config type
    const config: Config = {
        debug: true,
        version: "1.0.0"
    };

    console.log("2 + 3 =", addFn(2, 3));
    console.log("4 * 5 =", mulFn(4, 5));
    console.log("PI =", pi);
    console.log("Config:", config);
}

simulateModuleUsage();`
            },
            {
                id: "namespaces-1",
                title: "Namespaces (Internal Modules)",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Organizing Code with Namespaces</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Namespaces (formerly "internal modules") organize code within a single global scope using the <code>namespace</code> keyword. They're useful for grouping related types and utilities without file boundaries.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Namespaces can be <strong>nested</strong>, span multiple files (with <code>/// &lt;reference&gt;</code> directives), and export both values and types.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">For modern codebases, prefer ES modules over namespaces. Namespaces are primarily useful in ambient declarations (<code>.d.ts</code>) and legacy code.</p>
                `,
                defaultCode: `// --- Namespaces ---

namespace Validation {
    export interface StringValidator {
        isValid(s: string): boolean;
    }

    export class LettersOnlyValidator implements StringValidator {
        isValid(s: string): boolean {
            return /^[A-Za-z]+$/.test(s);
        }
    }

    export class ZipCodeValidator implements StringValidator {
        isValid(s: string): boolean {
            return /^\\d{5}(-\\d{4})?$/.test(s);
        }
    }

    // Nested namespace
    export namespace Helpers {
        export function sanitize(input: string): string {
            return input.trim().toLowerCase();
        }
    }
}

// Usage
const validators: { [s: string]: Validation.StringValidator } = {};
validators["Letters"] = new Validation.LettersOnlyValidator();
validators["Zip"] = new Validation.ZipCodeValidator();

const tests = ["Hello", "ABC123", "90210", "12345-6789"];
tests.forEach(test => {
    for (const key in validators) {
        const isValid = validators[key].isValid(test);
        console.log(\`\${test} - \${key}: \${isValid}\`);
    }
});

console.log("Sanitized:", Validation.Helpers.sanitize("  Hello World!  "));`
            }
        ],
        quiz: [
            {
                id: "q-modules-1",
                question: "Which import syntax ensures types are erased at runtime?",
                options: ["import { Type } from './types'", "import type { Type } from './types'", "import { type Type } from './types'", "Both B and C"],
                correct: 3
            },
            {
                id: "q-modules-2",
                question: "What's the modern preferred way to organize TypeScript code?",
                options: ["Namespaces", "ES Modules", "IIFEs", "AMD Modules"],
                correct: 1
            }
        ]
    },
    {
        id: "type-guards",
        title: "Type Guards & Advanced Patterns",
        lessons: [
            {
                id: "type-guards-1",
                title: "Type Guards & Narrowing",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Runtime Type Safety</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Type guards</strong> are expressions that perform runtime checks to guarantee the type of a value within a certain scope. TypeScript narrows the type automatically inside guarded blocks.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Built-in guards: <code>typeof</code>, <code>instanceof</code>, <code>Array.isArray()</code>, and <code>in</code> operator. For custom logic, use <strong>type predicates</strong> (<code>variable is Type</code> return type).</p>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Assertion functions</strong> and <strong>discriminated unions</strong> are additional narrowing techniques that make complex type flow analysis possible.</p>
                `,
                defaultCode: `// --- Type Guards & Narrowing ---

// typeof guard
function processValue(value: string | number): string {
    if (typeof value === "string") {
        // TypeScript knows value is string here
        return value.toUpperCase();
    }
    // TypeScript knows value is number here
    return value.toFixed(2);
}

// instanceof guard
class Dog {
    bark() { return "Woof!"; }
}
class Cat {
    meow() { return "Meow!"; }
}

function makeSound(animal: Dog | Cat): string {
    if (animal instanceof Dog) {
        return animal.bark();
    }
    return animal.meow();
}

// Custom type predicate
interface Fish { swim(): void; }
interface Bird { fly(): void; }

function isFish(pet: Fish | Bird): pet is Fish {
    return (pet as Fish).swim !== undefined;
}

function move(pet: Fish | Bird): string {
    if (isFish(pet)) {
        return "Swimming...";
    }
    return "Flying...";
}

// in operator guard
interface Car { drive(): void; }
interface Boat { sail(): void; }

function operate(vehicle: Car | Boat): string {
    if ("drive" in vehicle) {
        return "Driving on road";
    }
    return "Sailing on water";
}

console.log(processValue(42));
console.log(processValue("hello"));
console.log(makeSound(new Dog()));
console.log(move({ swim() {} }));
console.log(operate({ drive() {} }));`
            },
            {
                id: "advanced-1",
                title: "Mapped & Conditional Types",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Advanced Type Transformations</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Mapped types</strong> transform existing types by iterating over their properties. They power utility types like <code>Partial&lt;T&gt;</code> and <code>Readonly&lt;T&gt;</code>.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Conditional types</strong> select types based on conditions, enabling type-level programming with <code>T extends U ? X : Y</code> syntax.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Template literal types</strong> (TS 4.1+) allow string pattern matching and manipulation at the type level, useful for event emitters, CSS properties, and API paths.</p>
                `,
                defaultCode: `// --- Mapped & Conditional Types ---

// Mapped types
type Readonly2<T> = {
    readonly [P in keyof T]: T[P];
};

type Optional<T> = {
    [P in keyof T]?: T[P];
};

interface Person {
    name: string;
    age: number;
    email: string;
}

const readonlyPerson: Readonly2<Person> = {
    name: "Alice",
    age: 30,
    email: "alice@example.com"
};

// Conditional types
type IsString<T> = T extends string ? "yes" : "no";
type Test1 = IsString<string>;   // "yes"
type Test2 = IsString<number>;   // "no"

// Conditional with infer
type ReturnType2<T> =
    T extends (...args: any[]) => infer R ? R : never;

function greet() { return "hello"; }
type GreetReturn = ReturnType2<typeof greet>;  // string

// Template literal types (TS 4.1+)
type EventName = \`on\${Capitalize<string>}\`;
type CSSKey = \`--\${string}\`;

// Practical: Type-safe event system
type EventPayloads = {
    click: { x: number; y: number };
    keydown: { key: string };
    focus: {};
};

type EventCallback<E extends keyof EventPayloads> =
    (payload: EventPayloads[E]) => void;

function on<E extends keyof EventPayloads>(
    event: E,
    callback: EventCallback<E>
) {
    console.log(\`Registered handler for \${event}\`);
}

on("click", (payload) => {
    console.log(\"Clicked at:\", payload.x, payload.y);
});

console.log("Readonly person:", readonlyPerson);
console.log("Return type of greet is string:", true);`
            }
        ],
        quiz: [
            {
                id: "q-guards-1",
                question: "What return type defines a custom type guard?",
                options: ["boolean", "value is Type", "asserts value is Type", "Type | undefined"],
                correct: 1
            },
            {
                id: "q-guards-2",
                question: "Which syntax is used for conditional types?",
                options: ["T ? X : Y", "T extends U ? X : Y", "if (T) X else Y", "T match { X => Y }"],
                correct: 1
            }
        ]
    },
    {
        id: "real-world",
        title: "Real-world Project Examples",
        lessons: [
            {
                id: "real-world-1",
                title: "Building a Type-Safe API Client",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Applying TypeScript to Real Projects</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Let's combine everything you've learned into a practical <strong>type-safe API client</strong>. This project uses generics, discriminated unions, utility types, and type guards to create a robust HTTP client.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Key patterns demonstrated:</p>
                    <ul class="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                        <li>Generic request/response types for endpoint safety</li>
                        <li>Discriminated union for success/error handling</li>
                        <li>Type guards for runtime response validation</li>
                        <li>Utility types for configuration</li>
                    </ul>
                    <p class="mb-4 text-gray-700 leading-relaxed">This pattern is used in production by companies like Microsoft, Google, and Airbnb for their TypeScript codebases.</p>
                `,
                defaultCode: `// --- Type-Safe API Client ---

// Core response types
type ApiResult<T> =
    | { success: true; data: T; timestamp: Date }
    | { success: false; error: string; code: number };

// Type guard for success
function isSuccess<T>(result: ApiResult<T>): result is { success: true; data: T; timestamp: Date } {
    return result.success;
}

// Generic API client
class ApiClient {
    constructor(private baseUrl: string) {}

    async get<T>(endpoint: string): Promise<ApiResult<T>> {
        try {
            // Simulated API call
            console.log(\`GET \${this.baseUrl}\${endpoint}\`);
            const data = await this.simulateResponse<T>(endpoint);
            return { success: true, data, timestamp: new Date() };
        } catch (err) {
            return { success: false, error: String(err), code: 500 };
        }
    }

    async post<T, B>(endpoint: string, body: B): Promise<ApiResult<T>> {
        try {
            console.log(\`POST \${this.baseUrl}\${endpoint}\`, body);
            const data = await this.simulateResponse<T>(endpoint);
            return { success: true, data, timestamp: new Date() };
        } catch (err) {
            return { success: false, error: String(err), code: 500 };
        }
    }

    private simulateResponse<T>(endpoint: string): Promise<T> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ id: 1, name: "Product A", price: 29.99 } as T);
            }, 100);
        });
    }
}

// Domain types
interface Product {
    id: number;
    name: string;
    price: number;
}

interface CreateProductDto {
    name: string;
    price: number;
}

// Usage
async function main() {
    const api = new ApiClient("https://api.example.com");

    const products = await api.get<Product[]>("/products");
    if (isSuccess(products)) {
        console.log("Products loaded:", products.data.length);
    } else {
        console.error("Error:", products.error);
    }

    const created = await api.post<Product, CreateProductDto>(
        "/products",
        { name: "New Product", price: 19.99 }
    );

    if (isSuccess(created)) {
        console.log("Created product:", created.data);
    }
}

main().then(() => console.log("\\n✓ API client demo complete!"));`
            }
        ],
        quiz: [
            {
                id: "q-realworld-1",
                question: "What pattern is recommended for representing success/failure in TypeScript?",
                options: ["Try/catch everywhere", "Discriminated union with success/error variants", "Returning null on failure", "Using the Result class from Java"],
                correct: 1
            }
        ]
    }
];

// --- State & Progress ---
let state = {
    activeModuleId: curriculum[0].id,
    activeLessonId: curriculum[0].lessons[0].id,
    activeTab: 'lesson',
    completedItems: [],
    quizAnswers: {}
};

function loadProgress() {
    try {
        const saved = localStorage.getItem('tsAcademyProgress');
        if (saved) {
            state.completedItems = JSON.parse(saved);
        }
    } catch (e) {
        console.error("Failed to load progress", e);
    }
}

function saveProgress() {
    try {
        localStorage.setItem('tsAcademyProgress', JSON.stringify(state.completedItems));
    } catch (e) {
        console.error("Failed to save progress", e);
    }
    updateProgressBar();
    renderSidebar();
}

function markItemComplete(id) {
    if (!state.completedItems.includes(id)) {
        state.completedItems.push(id);
        saveProgress();
    }
}

function updateProgressBar() {
    let totalItems = 0;
    curriculum.forEach(mod => {
        totalItems += mod.lessons.length;
        if (mod.quiz && mod.quiz.length > 0) totalItems += 1;
    });

    if (totalItems === 0) return;
    const progressPercent = Math.round((state.completedItems.length / totalItems) * 100);

    document.getElementById('progress-bar').style.width = `${progressPercent}%`;
    document.getElementById('progress-text').innerText = `${progressPercent}%`;
}

const DOM = {
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    sidebar: document.getElementById('sidebar'),
    openSidebarBtn: document.getElementById('open-sidebar'),
    closeSidebarBtn: document.getElementById('close-sidebar'),
    moduleList: document.getElementById('module-list'),
    activeModuleTitle: document.getElementById('active-module-title'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    tabLesson: document.getElementById('tab-lesson'),
    tabPlayground: document.getElementById('tab-playground'),
    tabQuiz: document.getElementById('tab-quiz'),
    codeEditor: document.getElementById('code-editor'),
    runCodeBtn: document.getElementById('run-code-btn'),
    previewFrame: document.getElementById('preview-frame')
};

function init() {
    loadProgress();
    updateProgressBar();
    setupEventListeners();
    renderSidebar();
    renderActiveState();
}

function setupEventListeners() {
    DOM.openSidebarBtn.addEventListener('click', () => {
        DOM.sidebar.classList.remove('-translate-x-full');
        DOM.sidebarOverlay.classList.remove('hidden');
    });

    const closeSidebar = () => {
        DOM.sidebar.classList.add('-translate-x-full');
        DOM.sidebarOverlay.classList.add('hidden');
    };

    DOM.closeSidebarBtn.addEventListener('click', closeSidebar);
    DOM.sidebarOverlay.addEventListener('click', closeSidebar);

    DOM.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    DOM.runCodeBtn.addEventListener('click', runCode);

    DOM.codeEditor.addEventListener('keydown', function(e) {
        if (e.key == 'Tab') {
            e.preventDefault();
            var start = this.selectionStart;
            var end = this.selectionEnd;
            this.value = this.value.substring(0, start) + "  " + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 2;
        }
    });
}

function switchTab(tabId) {
    state.activeTab = tabId;

    DOM.tabBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    DOM.tabContents.forEach(content => {
        content.classList.remove('active', 'flex', 'md:flex');
    });

    const activeContent = document.getElementById(`tab-${tabId}`);
    if (tabId === 'playground') {
        activeContent.classList.add('active', 'flex', 'md:flex-row');
    } else {
        activeContent.classList.add('active');
    }
}

function getActiveModule() {
    return curriculum.find(m => m.id === state.activeModuleId) || curriculum[0];
}

function getActiveLesson() {
    const mod = getActiveModule();
    return mod.lessons.find(l => l.id === state.activeLessonId) || mod.lessons[0];
}

function changeModule(moduleId) {
    const mod = curriculum.find(m => m.id === moduleId);
    if (mod) {
        state.activeModuleId = moduleId;
        state.activeLessonId = mod.lessons[0].id;
        DOM.previewFrame.srcdoc = '';

        renderSidebar();
        renderActiveState();
        if (window.innerWidth < 1024) {
            DOM.sidebar.classList.add('-translate-x-full');
            DOM.sidebarOverlay.classList.add('hidden');
        }
    }
}

function renderSidebar() {
    DOM.moduleList.innerHTML = '';

    curriculum.forEach((mod, idx) => {
        const isActive = mod.id === state.activeModuleId;
        const allLessonsDone = mod.lessons.every(l => state.completedItems.includes(l.id));
        const quizDone = mod.quiz && mod.quiz.length > 0 ? state.completedItems.includes(`${mod.id}-quiz`) : true;
        const isModuleComplete = allLessonsDone && quizDone;

        const li = document.createElement('li');
        li.style.animationDelay = `${idx * 0.03}s`;

        const node = document.createElement('div');
        let nodeClass = 'timeline-node';
        if (isActive) {
            nodeClass += ' timeline-node--active';
        } else if (isModuleComplete) {
            nodeClass += ' timeline-node--complete';
        } else {
            nodeClass += ' timeline-node--incomplete';
        }
        node.className = nodeClass;

        const btn = document.createElement('button');
        let btnClass = 'sidebar-module-btn';
        if (isActive) btnClass += ' sidebar-module-btn--active';
        if (isModuleComplete) btnClass += ' sidebar-module-btn--complete';
        btn.className = btnClass;
        btn.onclick = () => changeModule(mod.id);

        const contentRow = document.createElement('span');
        contentRow.className = 'flex items-center gap-2.5 min-w-0';

        const badge = document.createElement('span');
        let badgeClass = 'module-badge';
        if (isActive) {
            badgeClass += ' module-badge--active';
        } else if (isModuleComplete) {
            badgeClass += ' module-badge--complete';
        } else {
            badgeClass += ' module-badge--default';
        }
        badge.className = badgeClass;
        badge.textContent = String(idx + 1).padStart(2, '0');

        const title = document.createElement('span');
        title.className = 'sidebar-module-title truncate';
        title.textContent = mod.title;

        contentRow.appendChild(badge);
        contentRow.appendChild(title);
        btn.appendChild(contentRow);

        if (isModuleComplete) {
            const checkIcon = document.createElement('i');
            checkIcon.className = `fa-solid fa-check-circle module-check ${isActive ? 'module-check--visible' : ''}`;
            btn.appendChild(checkIcon);
        }

        li.appendChild(node);
        li.appendChild(btn);
        DOM.moduleList.appendChild(li);
    });
}

function renderActiveState() {
    const mod = getActiveModule();
    const lesson = getActiveLesson();

    DOM.activeModuleTitle.innerText = mod.title;

    renderLesson(lesson);
    renderQuiz(mod);

    DOM.codeEditor.value = lesson.defaultCode;
}

function renderLesson(lesson) {
    const isCompleted = state.completedItems.includes(lesson.id);

    DOM.tabLesson.innerHTML = `
        <div class="max-w-3xl mx-auto animate-fade-in">
            <h2 class="text-3xl font-bold text-gray-900 mb-6" style="font-family: 'DM Sans', sans-serif; letter-spacing: -0.02em;">${lesson.title}</h2>
            <div class="prose max-w-none text-gray-800">
                ${lesson.content}
            </div>

            <div class="mt-12 pt-6 border-t border-gray-200 flex justify-end">
                <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${isCompleted ? 'bg-gray-200 text-gray-700 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}">
                    ${isCompleted ? '<i class="fa-solid fa-check"></i> Completed' : 'Mark as Complete & Continue'}
                </button>
            </div>
        </div>
    `;

    const btn = document.getElementById('mark-lesson-complete');
    if (!isCompleted) {
        btn.addEventListener('click', () => {
            markItemComplete(lesson.id);
            renderLesson(lesson);
            switchTab('playground');
        });
    }
}

function renderQuiz(mod) {
    const quizId = `${mod.id}-quiz`;
    const isCompleted = state.completedItems.includes(quizId);

    if (!mod.quiz || mod.quiz.length === 0) {
        DOM.tabQuiz.innerHTML = '<div class="text-center text-gray-500 mt-10">No quiz available for this module.</div>';
        return;
    }

    let html = `
        <div class="max-w-3xl mx-auto animate-fade-in pb-12">
            <div class="mb-8 border-b pb-4">
                <h2 class="text-3xl font-bold text-gray-900" style="font-family: 'DM Sans', sans-serif; letter-spacing: -0.02em;">Module Quiz</h2>
                ${isCompleted ? '<span class="inline-block mt-3 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fa-solid fa-check mr-1"></i> Passed</span>' : ''}
            </div>
            <div id="quiz-questions-container" class="space-y-8">
    `;

    mod.quiz.forEach((q, index) => {
        html += `
            <div class="bg-white border rounded-xl p-6 shadow-sm">
                <h4 class="font-semibold text-lg text-gray-800 mb-4"><span class="text-blue-600 mr-2">${index + 1}.</span>${q.question}</h4>
                <div class="space-y-3">
        `;

        q.options.forEach((opt, optIdx) => {
            const isSelected = state.quizAnswers[q.id] === optIdx;

            html += `
                <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50 border-gray-200'}">
                    <input type="radio" name="quiz-${q.id}" value="${optIdx}" class="form-radio text-blue-600 h-5 w-5" ${isSelected ? 'checked' : ''} onchange="handleQuizSelection('${q.id}', ${optIdx})">
                    <span class="ml-3 text-gray-700">${opt}</span>
                </label>
            `;
        });

        html += `</div></div>`;
    });

    html += `
            </div>
            <div class="mt-8 flex flex-col items-center border-t pt-8">
                <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all">Submit Answers</button>
                <div id="quiz-feedback" class="mt-4 text-lg font-bold hidden"></div>
            </div>
        </div>
    `;

    DOM.tabQuiz.innerHTML = html;

    document.getElementById('submit-quiz-btn').addEventListener('click', () => {
        let score = 0;
        let allAnswered = true;

        mod.quiz.forEach(q => {
            if (state.quizAnswers[q.id] === undefined) {
                allAnswered = false;
            } else if (state.quizAnswers[q.id] === q.correct) {
                score++;
            }
        });

        const feedback = document.getElementById('quiz-feedback');
        feedback.classList.remove('hidden', 'text-red-600', 'text-green-600');

        if (!allAnswered) {
            feedback.innerText = "Please answer all questions.";
            feedback.classList.add('text-red-600');
            return;
        }

        if (score === mod.quiz.length) {
            feedback.innerHTML = '<i class="fa-solid fa-check"></i> Perfect! You passed.';
            feedback.classList.add('text-green-600');
            markItemComplete(quizId);
            renderSidebar();
        } else {
            feedback.innerText = `You scored ${score} out of ${mod.quiz.length}. Try again!`;
            feedback.classList.add('text-red-600');
        }
    });
}

window.handleQuizSelection = function(questionId, optionIndex) {
    state.quizAnswers[questionId] = optionIndex;
    renderQuiz(getActiveModule());
};

// --- TypeScript Playground ---

function runCode() {
    const userCode = DOM.codeEditor.value;
    const logs = [];
    const errors = [];

    const iframe = DOM.previewFrame;

    function updateOutput() {
        var parts = [];
        if (errors.length > 0) {
            parts.push('<div id="error-boundary"><strong>Error:</strong><br/>' + errors.join('<br/>') + '</div>');
        } else {
            parts.push('<div style="color:#16a34a;font-size:12px;font-weight:600;margin-bottom:10px">Compiled successfully</div>');
        }
        parts.push('<div id="output-box">' + logs.join('\n') + '</div>');
        iframe.srcdoc = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:20px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;background:#fff;color:#1f2937}#error-boundary{color:#dc2626;background:#fee2e2;padding:15px;border-radius:8px;margin:10px;font-family:monospace;white-space:pre-wrap;border:1px solid #fca5a5}#output-box{background:#1e293b;color:#e2e8f0;padding:16px;border-radius:8px;font-family:monospace;font-size:13px;line-height:1.6;white-space:pre-wrap;overflow-x:auto}</style></head><body>' + parts.join('') + '</body></html>';
    }

    if (typeof ts === 'undefined') {
        errors.push('TypeScript compiler not loaded yet. Please wait.');
        updateOutput();
        return;
    }

    try {
        var result = ts.transpileModule(userCode, {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2020,
                strict: true,
                experimentalDecorators: true,
                removeComments: true
            }
        });

        var compiledCode = result.outputText;

        var origLog = console.log;
        console.log = function() {
            var args = Array.prototype.slice.call(arguments);
            var text = args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); }).join(' ');
            logs.push(text);
            origLog.apply(console, args);
        };

        try {
            var sandbox = { exports: {} };
            var fnParams = ['exports', 'require', 'module'];
            var fnArgs = [sandbox.exports, function() { throw new Error('require() not available in playground'); }, sandbox];
            (new Function(fnParams.join(','), compiledCode)).apply(null, fnArgs);
        } catch (execErr) {
            errors.push(execErr.message || String(execErr));
        } finally {
            console.log = origLog;
        }
    } catch (compileErr) {
        errors.push(compileErr.message || String(compileErr));
    }

    updateOutput();
}

init();
