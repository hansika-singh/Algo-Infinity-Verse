/* ============================================
   RUST ACADEMY — Curriculum, State & Simulator
   ============================================ */

const STORAGE_KEY = 'rustAcademyProgress';

/* ─── Curriculum Data ─── */
const curriculum = [
    {
        id: 'ownership',
        title: 'Ownership & Move Semantics',
        lessons: [
            {
                id: 'ownership-1',
                title: 'What is Ownership?',
                content: `
                    <h2>What is Ownership?</h2>
                    <p>Ownership is Rust's most unique feature. It enables memory safety without a garbage collector by enforcing strict rules at compile time.</p>

                    <h3>The Three Rules</h3>
                    <ol>
                        <li>Each value has an <strong>owner</strong>.</li>
                        <li>There can only be <strong>one owner</strong> at a time.</li>
                        <li>When the owner goes out of scope, the value is <strong>dropped</strong>.</li>
                    </ol>

                    <pre><code>fn main() {
    let s1 = String::from("hello"); // s1 is the owner
    let s2 = s1;                     // ownership moves to s2
    // println!("{}", s1);           // ERROR: s1 no longer valid
    println!("{}", s2);              // works fine
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Key Insight</div>
                        <p>When you assign <code>s1</code> to <code>s2</code>, Rust doesn't copy the data. It transfers ownership. This is called a <strong>move</strong>.</p>
                    </div>

                    <h3>Scope and Drop</h3>
                    <p>When a variable goes out of scope, Rust automatically calls the <code>drop</code> function to free memory:</p>
                    <pre><code>fn main() {
    {
        let s = String::from("hello");
        // s is valid here
    }
    // s is no longer valid — memory freed
}</code></pre>
                `,
                defaultCode: `fn main() {
    let greeting = String::from("Hello, Rust!");
    let moved_greeting = greeting;
    println!("{}", moved_greeting);
}`
            },
            {
                id: 'ownership-2',
                title: 'Clone & Copy Types',
                content: `
                    <h2>Clone & Copy Types</h2>
                    <p>Sometimes you need to duplicate data instead of moving it. Rust provides two mechanisms: <code>Clone</code> and <code>Copy</code>.</p>

                    <h3>Deep Clone with .clone()</h3>
                    <p>For heap-allocated types like <code>String</code>, use <code>.clone()</code> to create a deep copy:</p>
                    <pre><code>fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone();  // deep copy
    println!("s1 = {}, s2 = {}", s1, s2); // both valid
}</code></pre>

                    <h3>Copy Types (Stack-Only)</h3>
                    <p>Simple types that live entirely on the stack implement the <code>Copy</code> trait and are automatically duplicated:</p>
                    <pre><code>fn main() {
    let x = 5;
    let y = x;  // copy, not move
    println!("x = {}, y = {}", x, y); // both valid
}</code></pre>

                    <p>Types that implement <code>Copy</code>: integers, floats, booleans, characters, tuples of Copy types.</p>

                    <div class="callout">
                        <div class="callout-title">Rule of Thumb</div>
                        <p>If a type needs to free memory when dropped, it cannot implement <code>Copy</code>. Use <code>Clone</code> explicitly instead.</p>
                    </div>
                `,
                defaultCode: `fn main() {
    let a = String::from("owned");
    let b = a.clone();
    let x = 42;
    let y = x;
    println!("a = {}, b = {}", a, b);
    println!("x = {}, y = {}", x, y);
}`
            }
        ],
        quiz: [
            {
                id: 'q-ownership-1',
                question: 'What happens when you assign a String to another variable?',
                options: [
                    'Both variables reference the same memory',
                    'The value is deep copied automatically',
                    'Ownership is transferred (moved)',
                    'A compile error occurs'
                ],
                correct: 2
            },
            {
                id: 'q-ownership-2',
                question: 'Which types implement Copy automatically?',
                options: [
                    'String and Vec',
                    'Integers and booleans',
                    'HashMap and HashSet',
                    'All Rust types'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'borrowing',
        title: 'Borrowing & References',
        lessons: [
            {
                id: 'borrowing-1',
                title: 'Immutable & Mutable References',
                content: `
                    <h2>Immutable & Mutable References</h2>
                    <p>Borrowing lets you reference a value without taking ownership. This is done via references (<code>&</code>).</p>

                    <h3>Immutable References</h3>
                    <p>You can have <strong>multiple</strong> immutable references simultaneously:</p>
                    <pre><code>fn calculate_length(s: &String) -> usize {
    s.len()  // we can read, but not modify
}

fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1);
    println!("'{}' has length {}", s1, len); // s1 still valid
}</code></pre>

                    <h3>Mutable References</h3>
                    <p>You can have only <strong>one</strong> mutable reference at a time:</p>
                    <pre><code>fn change(s: &mut String) {
    s.push_str(", world");
}

fn main() {
    let mut s = String::from("hello");
    change(&mut s);
    println!("{}", s); // "hello, world"
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Borrowing Rules</div>
                        <p>You can have either:<br>
                        • Multiple immutable references (<code>&T</code>)<br>
                        • <strong>OR</strong> one mutable reference (<code>&mut T</code>)<br>
                        Never both at the same time.</p>
                    </div>
                `,
                defaultCode: `fn main() {
    let mut message = String::from("Hello");
    greet(&message);
    add_world(&mut message);
    println!("{}", message);
}

fn greet(s: &String) {
    println!("Greeting: {}", s);
}

fn add_world(s: &mut String) {
    s.push_str(", World!");
}`
            },
            {
                id: 'borrowing-2',
                title: 'Dangling References',
                content: `
                    <h2>Dangling References</h2>
                    <p>Rust's compiler prevents dangling references — references that point to data that no longer exists.</p>

                    <pre><code>// This won't compile!
fn dangle() -> &String {
    let s = String::from("hello");
    &s  // s is dropped when function returns!
}

fn no_dangle() -> String {
    let s = String::from("hello");
    s  // ownership is transferred to caller
}</code></pre>

                    <h3>Why This Matters</h3>
                    <p>In languages like C or C++, dangling pointers cause undefined behavior, crashes, and security vulnerabilities. Rust eliminates this class of bug entirely at compile time.</p>

                    <div class="callout">
                        <div class="callout-title">Safety Guarantee</div>
                        <p>Every reference in Rust is guaranteed to be valid. The compiler tracks lifetimes to ensure references never outlive the data they point to.</p>
                    </div>
                `,
                defaultCode: `fn main() {
    let value = String::from("safe reference");
    let reference = &value;
    println!("Value: {}", reference);
    
    // The reference is valid as long as value exists
    drop(value);
    // reference would be invalid here — compiler prevents this
}`
            }
        ],
        quiz: [
            {
                id: 'q-borrowing-1',
                question: 'How many mutable references can exist at the same time?',
                options: [
                    'Unlimited',
                    'Two',
                    'One',
                    'None'
                ],
                correct: 2
            },
            {
                id: 'q-borrowing-2',
                question: 'Why does Rust prevent dangling references?',
                options: [
                    'For performance optimization',
                    'To simplify the compiler',
                    'To prevent undefined behavior and memory safety issues',
                    'Because references are expensive'
                ],
                correct: 2
            }
        ]
    },
    {
        id: 'lifetimes',
        title: 'Lifetime Annotations',
        lessons: [
            {
                id: 'lifetimes-1',
                title: 'Understanding Lifetimes',
                content: `
                    <h2>Understanding Lifetimes</h2>
                    <p>Lifetimes are Rust's way of ensuring that references are always valid. Every reference has a lifetime — the scope for which it's usable.</p>

                    <h3>Implicit Lifetimes</h3>
                    <p>Most of the time, the compiler infers lifetimes automatically:</p>
                    <pre><code>fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() { x } else { y }
}</code></pre>

                    <h3>Explicit Lifetime Annotations</h3>
                    <p>When the compiler can't infer lifetimes, you must annotate them with <code>'a</code>:</p>
                    <pre><code>fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Lifetime Syntax</div>
                        <p>Lifetime annotations start with <code>'</code> (apostrophe) followed by a lowercase name. They describe the relationships between references, not how long values live.</p>
                    </div>
                `,
                defaultCode: `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let string1 = String::from("long string");
    let result;
    {
        let string2 = String::from("xyz");
        result = longest(string1.as_str(), string2.as_str());
        println!("Longest: {}", result);
    }
}`
            },
            {
                id: 'lifetimes-2',
                title: 'Lifetime Elision Rules',
                content: `
                    <h2>Lifetime Elision Rules</h2>
                    <p>Rust has rules that let you omit lifetime annotations in common patterns. The compiler applies these <strong>elision rules</strong> automatically:</p>

                    <h3>The Three Rules</h3>
                    <ol>
                        <li>Each parameter gets its own lifetime parameter.</li>
                        <li>If there's exactly one input lifetime, it's assigned to all output lifetimes.</li>
                        <li>If there's a <code>&self</code> or <code>&mut self</code> parameter, its lifetime is assigned to outputs.</li>
                    </ol>

                    <pre><code>// Compiler infers: fn first_word(s: &str) -> &str
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();
    for (i, &byte) in bytes.iter().enumerate() {
        if byte == b' ' {
            return &s[0..i];
        }
    }
    s
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">When Elision Fails</div>
                        <p>If the compiler can't apply any elision rule to determine the output lifetime, you must provide explicit annotations. This typically happens when multiple input references exist and no <code>&self</code> parameter.</p>
                    </div>
                `,
                defaultCode: `fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();
    for (i, &byte) in bytes.iter().enumerate() {
        if byte == b' ' {
            return &s[0..i];
        }
    }
    s
}

fn main() {
    let sentence = String::from("hello world");
    let word = first_word(&sentence);
    println!("First word: {}", word);
}`
            }
        ],
        quiz: [
            {
                id: 'q-lifetimes-1',
                question: 'What does a lifetime annotation like \'a represent?',
                options: [
                    'How long a variable lives in seconds',
                    'The scope for which a reference is valid',
                    'A memory allocation size',
                    'A type constraint'
                ],
                correct: 1
            },
            {
                id: 'q-lifetimes-2',
                question: 'When do you need explicit lifetime annotations?',
                options: [
                    'Every function that uses references',
                    'Only when the compiler can\'t infer lifetimes automatically',
                    'Only in struct definitions',
                    'Never — Rust handles everything'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'structs-enums',
        title: 'Structs, Enums & Pattern Matching',
        lessons: [
            {
                id: 'structs-enums-1',
                title: 'Structs & Methods',
                content: `
                    <h2>Structs & Methods</h2>
                    <p>Structs let you create custom data types by grouping related values together.</p>

                    <h3>Defining a Struct</h3>
                    <pre><code>struct User {
    username: String,
    email: String,
    active: bool,
    sign_in_count: u64,
}

fn main() {
    let user = User {
        username: String::from("rustacean"),
        email: String::from("rust@example.com"),
        active: true,
        sign_in_count: 1,
    };
}</code></pre>

                    <h3>Methods with impl</h3>
                    <pre><code>struct Rectangle {
    width: f64,
    height: f64,
}

impl Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }

    fn new(w: f64, h: f64) -> Rectangle {
        Rectangle { width: w, height: h }
    }
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Struct Update Syntax</div>
                        <p>Use <code>..user2</code> to create a new struct from an existing one: <code>let user2 = User { email: String::from("new"), ..user };</code></p>
                    </div>
                `,
                defaultCode: `struct Rectangle {
    width: f64,
    height: f64,
}

impl Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }
}

fn main() {
    let rect = Rectangle { width: 10.0, height: 5.0 };
    println!("Area: {}", rect.area());
}`
            },
            {
                id: 'structs-enums-2',
                title: 'Enums & Pattern Matching',
                content: `
                    <h2>Enums & Pattern Matching</h2>
                    <p>Enums define types by enumerating possible variants. Rust enums can hold data, unlike C enums.</p>

                    <h3>Defining Enums</h3>
                    <pre><code>enum IpAddr {
    V4(u8, u8, u8, u8),
    V6(String),
}

enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}</code></pre>

                    <h3>Pattern Matching with match</h3>
                    <pre><code>fn describe(msg: &Message) {
    match msg {
        Message::Quit => println!("Quit"),
        Message::Move { x, y } => println!("Move to ({}, {})", x, y),
        Message::Write(text) => println!("Write: {}", text),
        Message::ChangeColor(r, g, b) => println!("Color: ({}, {}, {})", r, g, b),
    }
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Exhaustive Matching</div>
                        <p>The <code>match</code> expression must cover all possible variants. This prevents missing edge cases at compile time.</p>
                    </div>
                `,
                defaultCode: `enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: &Coin) -> u32 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}

fn main() {
    let coin = Coin::Dime;
    println!("Value: {} cents", value_in_cents(&coin));
}`
            }
        ],
        quiz: [
            {
                id: 'q-structs-1',
                question: 'What is the purpose of the impl block?',
                options: [
                    'To define the struct fields',
                    'To implement methods and associated functions',
                    'To create instances of the struct',
                    'To destroy struct instances'
                ],
                correct: 1
            },
            {
                id: 'q-structs-2',
                question: 'What happens if a match expression doesn\'t cover all enum variants?',
                options: [
                    'It defaults to a null value',
                    'It throws a runtime exception',
                    'A compile error occurs',
                    'It silently ignores the missing variant'
                ],
                correct: 2
            }
        ]
    },
    {
        id: 'traits',
        title: 'Traits & Generics',
        lessons: [
            {
                id: 'traits-1',
                title: 'Defining & Implementing Traits',
                content: `
                    <h2>Defining & Implementing Traits</h2>
                    <p>Traits define shared behavior that multiple types can implement — similar to interfaces in other languages.</p>

                    <h3>Defining a Trait</h3>
                    <pre><code>trait Summary {
    fn summarize(&self) -> String;
}

struct Article {
    title: String,
    content: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{}: {}", self.title, &self.content[..50])
    }
}</code></pre>

                    <h3>Default Implementations</h3>
                    <pre><code>trait Summary {
    fn summarize(&self) -> String {
        String::from("(Read more...)")
    }
}

struct Tweet {
    content: String,
}

impl Summary for Tweet {
    // Can use default or override
    fn summarize(&self) -> String {
        format!("Tweet: {}", self.content)
    }
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Trait Bounds</div>
                        <p>Use <code>T: Summary</code> to restrict generic types to those implementing a trait: <code>fn notify(item: &impl Summary)</code></p>
                    </div>
                `,
                defaultCode: `trait Describable {
    fn describe(&self) -> String;
}

struct Product {
    name: String,
    price: f64,
}

impl Describable for Product {
    fn describe(&self) -> String {
        format!("{}: \${:.2}", self.name, self.price)
    }
}

fn main() {
    let item = Product {
        name: String::from("Rust Book"),
        price: 39.99,
    };
    println!("{}", item.describe());
}`
            },
            {
                id: 'traits-2',
                title: 'Trait Objects & Dynamic Dispatch',
                content: `
                    <h2>Trait Objects & Dynamic Dispatch</h2>
                    <p>When you need to work with different types through the same trait, use <strong>trait objects</strong> with <code>&dyn Trait</code>.</p>

                    <h3>Static vs Dynamic Dispatch</h3>
                    <pre><code>// Static dispatch — compiler generates code for each type
fn notify(item: &impl Summary) {
    println!("{}", item.summarize());
}

// Dynamic dispatch — uses a vtable at runtime
fn notify_dynamic(item: &dyn Summary) {
    println!("{}", item.summarize());
}</code></pre>

                    <h3>Collections of Trait Objects</h3>
                    <pre><code>fn main() {
    let items: Vec<Box<dyn Summary>> = vec![
        Box::new(Article { title: String::from("Rust") }),
        Box::new(Tweet { content: String::from("Hello") }),
    ];

    for item in &items {
        println!("{}", item.summarize());
    }
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Trade-offs</div>
                        <p>Static dispatch is faster (inlined), but dynamic dispatch offers flexibility. Use <code>dyn</code> when the types aren't known at compile time.</p>
                    </div>
                `,
                defaultCode: `trait Animal {
    fn sound(&self) -> &str;
}

struct Dog;
struct Cat;

impl Animal for Dog {
    fn sound(&self) -> &str { "Woof!" }
}

impl Animal for Cat {
    fn sound(&self) -> &str { "Meow!" }
}

fn make_sound(animal: &dyn Animal) {
    println!("{}", animal.sound());
}

fn main() {
    make_sound(&Dog);
    make_sound(&Cat);
}`
            }
        ],
        quiz: [
            {
                id: 'q-traits-1',
                question: 'What is the difference between &impl Trait and &dyn Trait?',
                options: [
                    'No difference — they are interchangeable',
                    '&impl Trait uses static dispatch, &dyn Trait uses dynamic dispatch',
                    '&dyn Trait is faster',
                    '&impl Trait only works with structs'
                ],
                correct: 1
            },
            {
                id: 'q-traits-2',
                question: 'Can a trait have a default implementation?',
                options: [
                    'No, all methods must be implemented',
                    'Yes, and implementors can override it',
                    'Only for static methods',
                    'Only for one method per trait'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'error-handling',
        title: 'Error Handling',
        lessons: [
            {
                id: 'error-handling-1',
                title: 'Result & Option',
                content: `
                    <h2>Result & Option</h2>
                    <p>Rust doesn't use exceptions. Instead, it uses <code>Result&lt;T, E&gt;</code> and <code>Option&lt;T&gt;</code> for error handling.</p>

                    <h3>Option<T></h3>
                    <p>Represents a value that might be absent:</p>
                    <pre><code>fn find_user(id: u32) -> Option<String> {
    if id == 1 {
        Some(String::from("Alice"))
    } else {
        None
    }
}

fn main() {
    match find_user(1) {
        Some(name) => println!("Found: {}", name),
        None => println!("User not found"),
    }
}</code></pre>

                    <h3>Result<T, E></h3>
                    <p>Represents success or failure:</p>
                    <pre><code>fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err(String::from("Cannot divide by zero"))
    } else {
        Ok(a / b)
    }
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">No Null, No Exceptions</div>
                        <p>Rust's type system makes null pointer exceptions and unhandled exceptions impossible. You must explicitly handle the <code>None</code> and <code>Err</code> cases.</p>
                    </div>
                `,
                defaultCode: `fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err(String::from("Cannot divide by zero"))
    } else {
        Ok(a / b)
    }
}

fn main() {
    match divide(10.0, 3.0) {
        Ok(result) => println!("Result: {:.2}", result),
        Err(e) => println!("Error: {}", e),
    }
    match divide(10.0, 0.0) {
        Ok(result) => println!("Result: {:.2}", result),
        Err(e) => println!("Error: {}", e),
    }
}`
            },
            {
                id: 'error-handling-2',
                title: 'The ? Operator',
                content: `
                    <h2>The ? Operator</h2>
                    <p>The <code>?</code> operator propagates errors up the call chain, replacing verbose match expressions.</p>

                    <h3>Before the ? Operator</h3>
                    <pre><code>fn read_file(path: &str) -> Result<String, io::Error> {
    let content = match fs::read_to_string(path) {
        Ok(c) => c,
        Err(e) => return Err(e),
    };
    Ok(content)
}</code></pre>

                    <h3>With the ? Operator</h3>
                    <pre><code>fn read_file(path: &str) -> Result<String, io::Error> {
    let content = fs::read_to_string(path)?;
    Ok(content)
}

// Even shorter:
fn read_file(path: &str) -> Result<String, io::Error> {
    fs::read_to_string(path)
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">? Operator Rules</div>
                        <p>The <code>?</code> can only be used in functions that return <code>Result</code> or <code>Option</code>. It automatically converts error types using <code>From</code> trait.</p>
                    </div>
                `,
                defaultCode: `fn parse_number(s: &str) -> Result<i32, String> {
    let n: i32 = s.parse().map_err(|e| e.to_string())?;
    Ok(n * 2)
}

fn main() {
    let inputs = vec!["42", "abc", "10"];
    for input in inputs {
        match parse_number(input) {
            Ok(n) => println!("'{}' -> {}", input, n),
            Err(e) => println!("'{}' -> Error: {}", input, e),
        }
    }
}`
            }
        ],
        quiz: [
            {
                id: 'q-error-1',
                question: 'What does the ? operator do?',
                options: [
                    'Checks if a value is null',
                    'Propagates errors to the calling function',
                    'Catches exceptions',
                    'Marks a line as optional'
                ],
                correct: 1
            },
            {
                id: 'q-error-2',
                question: 'Which type represents "a value that might be absent"?',
                options: [
                    'Result<T, E>',
                    'Option<T>',
                    'String',
                    'Vec<T>'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'concurrency',
        title: 'Fearless Concurrency',
        lessons: [
            {
                id: 'concurrency-1',
                title: 'Threads & Message Passing',
                content: `
                    <h2>Threads & Message Passing</h2>
                    <p>Rust's ownership system extends to concurrency, preventing data races at compile time.</p>

                    <h3>Spawning Threads</h3>
                    <pre><code>use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            println!("Spawned thread: {}", i);
            thread::sleep(std::time::Duration::from_millis(100));
        }
    });

    for i in 1..=3 {
        println!("Main thread: {}", i);
        thread::sleep(std::time::Duration::from_millis(150));
    }

    handle.join().unwrap(); // wait for spawned thread
}</code></pre>

                    <h3>Message Passing with Channels</h3>
                    <pre><code>use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        tx.send(String::from("Hello from thread")).unwrap();
    });

    let msg = rx.recv().unwrap();
    println!("Received: {}", msg);
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Ownership in Concurrency</div>
                        <p>When you <code>move</code> data into a thread, ownership transfers. The compiler ensures no two threads can modify the same data simultaneously.</p>
                    </div>
                `,
                defaultCode: `use std::thread;
use std::time::Duration;

fn main() {
    let mut handles = vec![];

    for i in 1..=3 {
        let handle = thread::spawn(move || {
            println!("Thread {} starting", i);
            thread::sleep(Duration::from_millis(100));
            println!("Thread {} done", i);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }
    println!("All threads finished");
}`
            },
            {
                id: 'concurrency-2',
                title: 'Shared State with Mutex & Arc',
                content: `
                    <h2>Shared State with Mutex & Arc</h2>
                    <p>When threads need to share data, use <code>Mutex&lt;T&gt;</code> for mutual exclusion and <code>Arc&lt;T&gt;</code> for atomic reference counting.</p>

                    <h3>Mutex<T></h3>
                    <pre><code>use std::sync::Mutex;

fn main() {
    let counter = Mutex::new(0);

    {
        let mut num = counter.lock().unwrap();
        *num += 1;
    }

    println!("Counter: {}", *counter.lock().unwrap());
}</code></pre>

                    <h3>Arc<T> for Sharing Across Threads</h3>
                    <pre><code>use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final: {}", *counter.lock().unwrap());
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Why Arc and Mutex?</div>
                        <p><code>Arc</code> (Atomic Reference Counting) is thread-safe. <code>Mutex</code> ensures only one thread accesses data at a time. Together, they enable safe shared state.</p>
                    </div>
                `,
                defaultCode: `use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for i in 0..5 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
            println!("Thread {} incremented to {}", i, *num);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }
    println!("Final count: {}", *counter.lock().unwrap());
}`
            }
        ],
        quiz: [
            {
                id: 'q-concurrency-1',
                question: 'What does Arc stand for in Rust concurrency?',
                options: [
                    'Atomic Reference Container',
                    'Atomic Reference Counting',
                    'Automatic Reference Cleanup',
                    'Asynchronous Runtime Context'
                ],
                correct: 1
            },
            {
                id: 'q-concurrency-2',
                question: 'What prevents data races in Rust?',
                options: [
                    'A garbage collector',
                    'Manual memory management',
                    'The ownership system and type checker',
                    'Runtime locks'
                ],
                correct: 2
            }
        ]
    },
    {
        id: 'unsafe-rust',
        title: 'Unsafe Rust',
        lessons: [
            {
                id: 'unsafe-rust-1',
                title: 'Unsafe Blocks & Raw Pointers',
                content: `
                    <h2>Unsafe Blocks & Raw Pointers</h2>
                    <p>Unsafe Rust lets you bypass some safety guarantees for performance or FFI interop. It's a controlled escape hatch.</p>

                    <h3>What Unsafe Allows</h3>
                    <ol>
                        <li>Dereference raw pointers</li>
                        <li>Call unsafe functions</li>
                        <li>Access or modify mutable static variables</li>
                        <li>Implement unsafe traits</li>
                        <li>Access fields of unions</li>
                    </ol>

                    <h3>Raw Pointers</h3>
                    <pre><code>fn main() {
    let mut value = 42;
    let r1 = &value as *const i32;     // const raw pointer
    let r2 = &mut value as *mut i32;   // mut raw pointer

    unsafe {
        println!("r1: {}", *r1);
        println!("r2: {}", *r2);
        *r2 = 100;
        println!("Modified: {}", *r2);
    }
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Safety in Unsafe</div>
                        <p>The <code>unsafe</code> keyword doesn't mean the code is dangerous — it means you're taking responsibility for upholding safety invariants. Keep unsafe blocks small and well-documented.</p>
                    </div>
                `,
                defaultCode: `fn main() {
    let mut num = 42;
    
    let raw_ptr = &mut num as *mut i32;
    
    unsafe {
        *raw_ptr = 100;
    }
    
    println!("Value: {}", num);
    
    // Safe Rust equivalent:
    num = 200;
    println!("Updated: {}", num);
}`
            }
        ],
        quiz: [
            {
                id: 'q-unsafe-1',
                question: 'Which of these requires an unsafe block?',
                options: [
                    'Creating a reference',
                    'Dereferencing a raw pointer',
                    'Using the ? operator',
                    'Implementing a trait'
                ],
                correct: 1
            }
        ]
    }
];

/* ─── State ─── */
let state = {
    activeModuleId: curriculum[0].id,
    activeLessonId: curriculum[0].lessons[0].id,
    activeTab: 'lesson',
    completedItems: [],
    quizAnswers: {},
    quizSubmitted: false
};

/* ─── DOM Cache ─── */
const DOM = {};

function cacheDOM() {
    DOM.sidebarOverlay = document.getElementById('sidebar-overlay');
    DOM.sidebar = document.getElementById('sidebar');
    DOM.openSidebarBtn = document.getElementById('open-sidebar-btn');
    DOM.closeSidebarBtn = document.getElementById('close-sidebar-btn');
    DOM.moduleList = document.getElementById('module-list');
    DOM.activeModuleTitle = document.getElementById('active-module-title');
    DOM.tabBtns = document.querySelectorAll('.tab-btn');
    DOM.tabContents = document.querySelectorAll('.tab-content');
    DOM.tabLesson = document.getElementById('tab-lesson');
    DOM.tabSimulator = document.getElementById('tab-simulator');
    DOM.tabQuiz = document.getElementById('tab-quiz');
    DOM.lessonContent = document.getElementById('lesson-content');
    DOM.markCompleteBtn = document.getElementById('mark-complete-btn');
    DOM.codeEditor = document.getElementById('code-editor');
    DOM.runCodeBtn = document.getElementById('run-code-btn');
    DOM.resetCodeBtn = document.getElementById('reset-code-btn');
    DOM.clearOutputBtn = document.getElementById('clear-output-btn');
    DOM.outputFrame = document.getElementById('output-frame');
    DOM.quizContainer = document.getElementById('quiz-container');
    DOM.progressBar = document.getElementById('progress-bar');
    DOM.progressText = document.getElementById('progress-text');
}

/* ─── Helpers ─── */
function getActiveModule() {
    return curriculum.find(m => m.id === state.activeModuleId) || curriculum[0];
}

function getActiveLesson() {
    const mod = getActiveModule();
    return mod.lessons.find(l => l.id === state.activeLessonId) || mod.lessons[0];
}

function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

/* ─── Progress ─── */
function loadProgress() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) state.completedItems = JSON.parse(saved);
    } catch { /* ignore */ }
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.completedItems));
}

function markItemComplete(itemId) {
    if (!state.completedItems.includes(itemId)) {
        state.completedItems.push(itemId);
        saveProgress();
    }
}

function isItemComplete(itemId) {
    return state.completedItems.includes(itemId);
}

function updateProgress() {
    let total = 0;
    let completed = 0;
    curriculum.forEach(mod => {
        total += mod.lessons.length;
        if (mod.quiz?.length > 0) total++;
    });
    completed = state.completedItems.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    DOM.progressBar.style.width = pct + '%';
    DOM.progressText.textContent = pct + '%';
}

/* ─── Sidebar ─── */
function renderSidebar() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    DOM.moduleList.innerHTML = curriculum.map((mod, idx) => {
        const allLessonsDone = mod.lessons.every(l => isItemComplete(l.id));
        const quizDone = mod.quiz?.length > 0 ? isItemComplete(mod.id + '-quiz') : true;
        const isModuleComplete = allLessonsDone && quizDone;
        const isActive = mod.id === state.activeModuleId;

        const nodeClass = isModuleComplete ? 'timeline-node--complete'
            : isActive ? 'timeline-node--active'
            : 'timeline-node--incomplete';

        const badgeClass = isModuleComplete ? 'module-badge--complete'
            : isActive ? 'module-badge--active'
            : '';

        const checkVisible = isModuleComplete ? 'visible' : '';

        return `
            <li style="animation-delay: ${reducedMotion ? '0s' : idx * 0.03}s">
                <div class="timeline-node ${nodeClass}"></div>
                <button class="sidebar-module-btn ${isActive ? 'active' : ''}"
                        data-module-id="${mod.id}">
                    <div class="module-content-row">
                        <span class="module-badge ${badgeClass}">${String(idx + 1).padStart(2, '0')}</span>
                        <span class="sidebar-module-title">${escHtml(mod.title)}</span>
                        <i class="fa-solid fa-check-circle module-check-icon ${checkVisible}"></i>
                    </div>
                </button>
            </li>
        `;
    }).join('');
}

function changeModule(moduleId) {
    const mod = curriculum.find(m => m.id === moduleId);
    if (!mod) return;
    state.activeModuleId = moduleId;
    state.activeLessonId = mod.lessons[0].id;
    state.quizAnswers = {};
    state.quizSubmitted = false;
    renderSidebar();
    renderActiveContent();
    updateProgress();
    closeSidebar();
}

/* ─── Tabs ─── */
function switchTab(tabId) {
    state.activeTab = tabId;
    DOM.tabBtns.forEach(btn => {
        const isActive = btn.getAttribute('data-tab') === tabId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    DOM.tabContents.forEach(c => {
        c.classList.remove('active', 'flex', 'md:flex-row');
    });
    const active = document.getElementById('tab-' + tabId);
    if (tabId === 'simulator') {
        active.classList.add('active', 'flex', 'md:flex-row');
    } else {
        active.classList.add('active');
    }
    renderActiveContent();
}

function renderActiveContent() {
    if (state.activeTab === 'lesson') renderLesson();
    else if (state.activeTab === 'simulator') loadCode();
    else if (state.activeTab === 'quiz') renderQuiz();
}

/* ─── Lesson ─── */
function renderLesson() {
    const lesson = getActiveLesson();
    const isComplete = isItemComplete(lesson.id);

    DOM.lessonContent.innerHTML = (window.eli5Toggle ? window.eli5Toggle.wrapContent(lesson.content, '') : lesson.content);
  if (window.eli5Toggle) {
    window.eli5Toggle.initToggle('rust', DOM.lessonContent);
  }

    DOM.markCompleteBtn.innerHTML = isComplete
        ? '<i class="fas fa-check-circle mr-2"></i> Completed'
        : '<i class="fas fa-check-circle mr-2"></i> Mark as Complete';
    DOM.markCompleteBtn.classList.toggle('completed', isComplete);

    DOM.activeModuleTitle.textContent = getActiveModule().title;
}

function setupMarkComplete() {
    DOM.markCompleteBtn.addEventListener('click', () => {
        const lesson = getActiveLesson();
        if (!isItemComplete(lesson.id)) {
            markItemComplete(lesson.id);
            renderLesson();
            renderSidebar();
            updateProgress();
        }
    });
}

/* ─── Simulator ─── */
function loadCode() {
    const lesson = getActiveLesson();
    if (lesson.defaultCode) {
        DOM.codeEditor.value = lesson.defaultCode;
    }
    DOM.activeModuleTitle.textContent = getActiveModule().title + ' — Simulator';
}

function runCode() {
    const code = DOM.codeEditor.value.trim();
    if (!code) {
        DOM.outputFrame.innerHTML = '<div class="output-info">Please write some Rust code first.</div>';
        return;
    }

    const logs = [];
    const errors = [];

    try {
        executeRustMock(code, logs, errors);
    } catch (e) {
        errors.push(e.message || 'Unknown error');
    }

    let html = '';
    if (errors.length > 0) {
        html += errors.map(e => `<div class="output-error">error: ${escHtml(e)}</div>`).join('');
    }
    if (logs.length > 0) {
        html += `<div class="output-success">${logs.map(l => escHtml(l)).join('\n')}</div>`;
    }
    if (logs.length === 0 && errors.length === 0) {
        html = '<div class="output-info">Program exited with no output.</div>';
    }

    DOM.outputFrame.innerHTML = html;
}

function executeRustMock(code, logs, errors) {
    const lines = code.split('\n').map(l => l.trim()).filter(l => l);
    const vars = {};

    for (const line of lines) {
        if (line.startsWith('//') || line === '' || line === '}' || line === '{') continue;

        const letMatch = line.match(/^let\s+(mut\s+)?(\w+)\s*=\s*(.+);/);
        if (letMatch) {
            const varName = letMatch[2];
            const value = parseValue(letMatch[3], vars);
            vars[varName] = value;
            continue;
        }

        const printMatch = line.match(/println!\s*\(\s*"([^"]*)"(?:\s*,\s*(.+))?\s*\)/);
        if (printMatch) {
            let template = printMatch[1];
            if (printMatch[2]) {
                const args = splitArgs(printMatch[2]);
                args.forEach((arg, i) => {
                    const val = evaluateExpression(arg.trim(), vars);
                    template = template.replace('{}', val);
                });
            }
            logs.push(template);
            continue;
        }

        const fnMatch = line.match(/^fn\s+(\w+)/);
        if (fnMatch) continue;

        if (line === '') continue;
    }
}

function parseValue(expr, vars) {
    expr = expr.trim();

    if (expr.startsWith('"') && expr.endsWith('"')) {
        return expr.slice(1, -1);
    }

    if (/^\d+(\.\d+)?$/.test(expr)) {
        return expr.includes('.') ? parseFloat(expr) : parseInt(expr);
    }

    if (expr === 'true') return true;
    if (expr === 'false') return false;

    if (vars[expr] !== undefined) return vars[expr];

    if (expr.startsWith('String::from(') && expr.endsWith(')')) {
        return expr.slice(13, -1).replace(/"/g, '');
    }

    return expr;
}

function splitArgs(argsStr) {
    const args = [];
    let depth = 0;
    let current = '';

    for (const ch of argsStr) {
        if (ch === '(' || ch === '[' || ch === '{') depth++;
        else if (ch === ')' || ch === ']' || ch === '}') depth--;
        else if (ch === ',' && depth === 0) {
            args.push(current);
            current = '';
            continue;
        }
        current += ch;
    }
    if (current) args.push(current);
    return args;
}

function evaluateExpression(expr, vars) {
    expr = expr.trim();

    if (vars[expr] !== undefined) return vars[expr];

    if (expr.startsWith('"') && expr.endsWith('"')) {
        return expr.slice(1, -1);
    }

    if (/^\d+(\.\d+)?$/.test(expr)) return expr;

    if (expr.includes('+')) {
        const parts = expr.split('+').map(p => evaluateExpression(p.trim(), vars));
        if (parts.every(p => typeof p === 'number')) return parts.reduce((a, b) => a + b, 0);
        return parts.join('');
    }

    if (expr.startsWith('String::from(') && expr.endsWith(')')) {
        return expr.slice(13, -1).replace(/"/g, '');
    }

    return expr;
}

function setupSimulator() {
    DOM.runCodeBtn.addEventListener('click', runCode);
    DOM.resetCodeBtn.addEventListener('click', () => {
        DOM.codeEditor.value = getActiveLesson().defaultCode || '';
    });
    DOM.clearOutputBtn.addEventListener('click', () => {
        DOM.outputFrame.innerHTML = '<div class="output-placeholder"><i class="fa-solid fa-play-circle"></i><p>Click <strong>Run</strong> to execute your code</p></div>';
    });

    DOM.codeEditor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = DOM.codeEditor.selectionStart;
            const end = DOM.codeEditor.selectionEnd;
            DOM.codeEditor.value = DOM.codeEditor.value.substring(0, start) + '    ' + DOM.codeEditor.value.substring(end);
            DOM.codeEditor.selectionStart = DOM.codeEditor.selectionEnd = start + 4;
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
    });
}

/* ─── Quiz ─── */
function renderQuiz() {
    const mod = getActiveModule();
    const quizId = mod.id + '-quiz';
    const isCompleted = isItemComplete(quizId);

    if (!mod.quiz || mod.quiz.length === 0) {
        DOM.quizContainer.innerHTML = `
            <div class="quiz-container" style="text-align:center; padding:3rem;">
                <i class="fa-solid fa-clipboard-check" style="font-size:3rem; color:#dea584; opacity:0.5; margin-bottom:1rem;"></i>
                <h3 style="font-family:var(--font-display); color:#475569; margin-bottom:0.5rem;">No Quiz Available</h3>
                <p style="color:#94a3b8; font-size:0.9rem;">This module doesn't have a quiz yet. Continue to the next module.</p>
            </div>
        `;
        DOM.activeModuleTitle.textContent = mod.title + ' — Quiz';
        return;
    }

    DOM.activeModuleTitle.textContent = mod.title + ' — Quiz';

    let html = `<h2 style="font-family:var(--font-display); font-size:1.5rem; margin-bottom:1.5rem; color:#1e293b;">
        ${escHtml(mod.title)} Quiz
    </h2>`;

    mod.quiz.forEach((q, idx) => {
        const selected = state.quizAnswers[q.id];
        const showResult = isCompleted;

        html += `
            <div class="quiz-question-card">
                <div class="quiz-question-number">Question ${idx + 1} of ${mod.quiz.length}</div>
                <div class="quiz-question-text">${escHtml(q.question)}</div>
                <div class="quiz-options">
                    ${q.options.map((opt, optIdx) => {
                        let classes = 'quiz-option';
                        if (selected === optIdx) classes += ' selected';
                        if (showResult && optIdx === q.correct) classes += ' correct';
                        if (showResult && selected === optIdx && optIdx !== q.correct) classes += ' incorrect';
                        return `
                            <div class="${classes}" data-question-id="${q.id}" data-option-index="${optIdx}">
                                <input type="radio" name="quiz-${q.id}" value="${optIdx}" 
                                    ${selected === optIdx ? 'checked' : ''} ${showResult ? 'disabled' : ''}>
                                <label>${escHtml(opt)}</label>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    if (!isCompleted) {
        const allAnswered = mod.quiz.every(q => state.quizAnswers[q.id] !== undefined);
        html += `
            <div class="quiz-submit-section">
                <button id="submit-quiz-btn" class="quiz-submit-btn" ${!allAnswered ? 'disabled' : ''}>
                    <i class="fas fa-paper-plane"></i> Submit Quiz
                </button>
            </div>
        `;
    }

    if (isCompleted) {
        const score = mod.quiz.filter(q => state.quizAnswers[q.id] === q.correct).length;
        const total = mod.quiz.length;
        html += `
            <div class="quiz-result quiz-result--pass">
                <i class="fas fa-check-circle"></i> Perfect! Module Complete!
            </div>
        `;
    } else if (state.quizSubmitted) {
        const score = mod.quiz.filter(q => state.quizAnswers[q.id] === q.correct).length;
        const total = mod.quiz.length;
        html += `
            <div class="quiz-result quiz-result--fail">
                <i class="fas fa-redo-alt"></i> Score: ${score}/${total} — Adjust your answers and try again.
            </div>
        `;
    }

    DOM.quizContainer.innerHTML = html;
}

function submitQuiz() {
    const mod = getActiveModule();
    state.quizSubmitted = true;
    let score = 0;

    mod.quiz.forEach(q => {
        if (state.quizAnswers[q.id] === q.correct) score++;
    });

    const quizId = mod.id + '-quiz';
    if (score === mod.quiz.length) {
        markItemComplete(quizId);
        renderSidebar();
        updateProgress();
    }

    renderQuiz();
}

/* ─── Mobile Sidebar ─── */
function openSidebar() {
    DOM.sidebar.classList.add('open');
    DOM.sidebarOverlay.classList.add('active');
}

function closeSidebar() {
    DOM.sidebar.classList.remove('open');
    DOM.sidebarOverlay.classList.remove('active');
}

function setupSidebar() {
    DOM.openSidebarBtn.addEventListener('click', openSidebar);
    DOM.closeSidebarBtn.addEventListener('click', closeSidebar);
    DOM.sidebarOverlay.addEventListener('click', closeSidebar);

    DOM.moduleList.addEventListener('click', (e) => {
        const btn = e.target.closest('.sidebar-module-btn');
        if (btn && btn.dataset.moduleId) {
            changeModule(btn.dataset.moduleId);
        }
    });
}

function setupQuiz() {
    DOM.quizContainer.addEventListener('click', (e) => {
        const option = e.target.closest('.quiz-option');
        if (option && option.dataset.questionId && option.dataset.optionIndex) {
            const module = getActiveModule();
            const quizId = module.id + '-quiz';
            if (isItemComplete(quizId)) return;
            state.quizSubmitted = false;
            state.quizAnswers[option.dataset.questionId] = parseInt(option.dataset.optionIndex);
            renderQuiz();
            return;
        }

        const submitBtn = e.target.closest('#submit-quiz-btn');
        if (submitBtn && !submitBtn.disabled) {
            submitQuiz();
        }
    });
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
    cacheDOM();
    loadProgress();
    setupSidebar();
    setupSimulator();
    setupMarkComplete();
    setupQuiz();

    DOM.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    renderSidebar();
    renderLesson();
    updateProgress();
});
