/* ============================================
   GO ACADEMY — Curriculum, State & Simulator
   ============================================ */

const STORAGE_KEY = 'goAcademyProgress';

/* ─── Curriculum Data ─── */
const curriculum = [
    {
        id: 'go-fundamentals',
        title: 'Go Fundamentals',
        lessons: [
            {
                id: 'go-fundamentals-1',
                title: 'Hello, World!',
                content: `
                    <h2>Hello, World!</h2>
                    <p>Every Go program starts with a <code>package</code> declaration. The <code>main</code> package is special — it defines a standalone executable.</p>

                    <h3>Your First Program</h3>
                    <pre><code>package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}</code></pre>

                    <h3>Breaking It Down</h3>
                    <ul>
                        <li><code>package main</code> — every Go file belongs to a package</li>
                        <li><code>import "fmt"</code> — imports the format package for I/O</li>
                        <li><code>func main()</code> — the entry point of your program</li>
                        <li><code>fmt.Println()</code> — prints a line to stdout</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Go's Philosophy</div>
                        <p>Go is designed for simplicity, clarity, and fast compilation. Unlike many modern languages, Go doesn't use classes or inheritance — it favors composition over inheritance.</p>
                    </div>
                `,
                defaultCode: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`
            },
            {
                id: 'go-fundamentals-2',
                title: 'Variables & Types',
                content: `
                    <h2>Variables & Types</h2>
                    <p>Go has strong static typing, but provides both explicit and inferred variable declarations.</p>

                    <h3>Variable Declaration</h3>
                    <p>The <code>var</code> keyword declares a variable with an explicit type:</p>
                    <pre><code>var name string = "Alice"
var age int = 30
var pi float64 = 3.14
var active bool = true</code></pre>

                    <h3>Short Declaration (:=)</h3>
                    <p>Inside functions, use <code>:=</code> for type inference:</p>
                    <pre><code>name := "Alice"
age := 30
pi := 3.14
active := true</code></pre>

                    <h3>Zero Values</h3>
                    <p>Go assigns default zero values to uninitialized variables:</p>
                    <pre><code>var i int       // 0
var f float64   // 0
var s string    // ""
var b bool      // false</code></pre>

                    <div class="callout">
                        <div class="callout-title">Why No Classes?</div>
                        <p>Go uses structs with methods instead of classes, avoiding the complexity of inheritance hierarchies while still providing powerful abstractions through interfaces.</p>
                    </div>
                `,
                defaultCode: `package main

import "fmt"

func main() {
    var name string = "Alice"
    age := 30
    pi := 3.14
    active := true

    fmt.Println("Name:", name)
    fmt.Println("Age:", age)
    fmt.Println("Pi:", pi)
    fmt.Println("Active:", active)
}`
            }
        ],
        quiz: [
            {
                id: 'q-go-fundamentals-1',
                question: 'What is the entry point of a Go program?',
                options: [
                    'The init() function',
                    'The main() function in package main',
                    'The first function declared',
                    'The run() function'
                ],
                correct: 1
            },
            {
                id: 'q-go-fundamentals-2',
                question: 'What is the zero value of an int in Go?',
                options: [
                    'null',
                    'nil',
                    '0',
                    'undefined'
                ],
                correct: 2
            }
        ]
    },
    {
        id: 'control-functions',
        title: 'Control Flow & Functions',
        lessons: [
            {
                id: 'control-functions-1',
                title: 'Conditionals & Loops',
                content: `
                    <h2>Conditionals & Loops</h2>
                    <p>Go keeps control flow simple with no parentheses around conditions and only one looping construct.</p>

                    <h3>If / Else</h3>
                    <pre><code>if x > 0 {
    fmt.Println("positive")
} else if x < 0 {
    fmt.Println("negative")
} else {
    fmt.Println("zero")
}</code></pre>

                    <h3>For Loop — The Only Loop</h3>
                    <p>Go has no <code>while</code> or <code>do-while</code> — just <code>for</code> in three forms:</p>
                    <pre><code>// Classic for
for i := 0; i < 5; i++ {
    fmt.Println(i)
}

// While-style
sum := 1
for sum < 100 {
    sum += sum
}

// Infinite loop
for {
    // break to exit
}</code></pre>

                    <h3>Switch Statement</h3>
                    <p>Go's switch is more powerful than C's — no <code>break</code> needed:</p>
                    <pre><code>switch os := runtime.GOOS; os {
case "darwin":
    fmt.Println("macOS")
case "linux":
    fmt.Println("Linux")
default:
    fmt.Printf("%s\\n", os)
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">No Parentheses</div>
                        <p>Go deliberately omits parentheses in conditions. The braces <code>{}</code> are always required — this prevents formatting ambiguities common in C and Java.</p>
                    </div>
                `,
                defaultCode: `package main

import "fmt"

func main() {
    for i := 1; i <= 5; i++ {
        if i%2 == 0 {
            fmt.Println(i, "is even")
        } else {
            fmt.Println(i, "is odd")
        }
    }
}`
            },
            {
                id: 'control-functions-2',
                title: 'Functions & Multiple Returns',
                content: `
                    <h2>Functions & Multiple Returns</h2>
                    <p>Functions in Go are first-class citizens and support multiple return values — a feature that enables clean error handling.</p>

                    <h3>Basic Function</h3>
                    <pre><code>func add(x int, y int) int {
    return x + y
}

// Shorthand: consecutive parameters of same type
func add(x, y int) int {
    return x + y
}</code></pre>

                    <h3>Multiple Return Values</h3>
                    <pre><code>func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

func main() {
    result, err := divide(10, 3)
    if err != nil {
        fmt.Println("Error:", err)
    } else {
        fmt.Println("Result:", result)
    }
}</code></pre>

                    <h3>Named Return Values</h3>
                    <p>Return values can have names, acting as local variables:</p>
                    <pre><code>func split(sum int) (x, y int) {
    x = sum * 4 / 9
    y = sum - x
    return // naked return
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Multiple Returns</div>
                        <p>Go's multiple return values are used extensively for returning both a result and an error. This avoids the exception-based error handling of Java or Python and makes error handling explicit.</p>
                    </div>
                `,
                defaultCode: `package main

import "fmt"

func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return a / b, nil
}

func main() {
    result, err := divide(10, 3)
    if err != nil {
        fmt.Println("Error:", err)
    } else {
        fmt.Printf("Result: %.2f\\n", result)
    }
}`
            }
        ],
        quiz: [
            {
                id: 'q-control-1',
                question: 'Which loop construct does Go use for while-style loops?',
                options: [
                    'while',
                    'do-while',
                    'for',
                    'loop'
                ],
                correct: 2
            },
            {
                id: 'q-control-2',
                question: 'What is special about Go functions?',
                options: [
                    'They can only return one value',
                    'They support multiple return values',
                    'They require explicit return types',
                    'They cannot be nested'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'structs-interfaces',
        title: 'Structs & Interfaces',
        lessons: [
            {
                id: 'structs-interfaces-1',
                title: 'Structs & Methods',
                content: `
                    <h2>Structs & Methods</h2>
                    <p>Go uses structs (not classes) to group data, and attaches methods to them via <strong>receiver</strong> functions.</p>

                    <h3>Defining a Struct</h3>
                    <pre><code>type Person struct {
    Name string
    Age  int
}

func main() {
    p1 := Person{"Alice", 30}
    p2 := Person{Name: "Bob", Age: 25}
    p3 := Person{Name: "Charlie"}
    fmt.Println(p1, p2, p3)
}</code></pre>

                    <h3>Methods with Receivers</h3>
                    <pre><code>type Rectangle struct {
    Width, Height float64
}

// Value receiver — read-only access
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

// Pointer receiver — can modify
func (r *Rectangle) Scale(factor float64) {
    r.Width *= factor
    r.Height *= factor
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Value vs Pointer Receiver</div>
                        <p>Use a value receiver when the method doesn't modify the struct. Use a pointer receiver to mutate state or avoid copying large structs.</p>
                    </div>
                `,
                defaultCode: `package main

import "fmt"

type Rectangle struct {
    Width, Height float64
}

func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

func main() {
    rect := Rectangle{Width: 10, Height: 5}
    fmt.Printf("Rectangle: %.1f x %.1f\\n", rect.Width, rect.Height)
    fmt.Printf("Area: %.1f\\n", rect.Area())
}`
            },
            {
                id: 'structs-interfaces-2',
                title: 'Interfaces & Composition',
                content: `
                    <h2>Interfaces & Composition</h2>
                    <p>Interfaces define behavior through method sets. Go's interfaces are satisfied implicitly — no <code>implements</code> keyword needed.</p>

                    <h3>Defining an Interface</h3>
                    <pre><code>type Shape interface {
    Area() float64
    Perimeter() float64
}

type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
    return 2 * math.Pi * c.Radius
}</code></pre>

                    <h3>Interface Satisfaction</h3>
                    <p>If a type implements all methods of an interface, it automatically satisfies it:</p>
                    <pre><code>func printShape(s Shape) {
    fmt.Printf("Area: %.2f\\n", s.Area())
}

func main() {
    c := Circle{Radius: 5}
    printShape(c) // Circle satisfies Shape implicitly
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Composition Over Inheritance</div>
                        <p>Go favors embedding (composition) over inheritance. A struct can embed another struct, inheriting its fields and methods:</p>
                        <pre><code>type Employee struct {
    Person  // embedded struct
    Salary  float64
}</code></pre>
                    </div>
                `,
                defaultCode: `package main

import "fmt"

type Shape interface {
    Area() float64
}

type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return 3.14159 * c.Radius * c.Radius
}

func describeShape(s Shape) {
    fmt.Printf("Shape area: %.2f\\n", s.Area())
}

func main() {
    c := Circle{Radius: 5}
    describeShape(c)
}`
            }
        ],
        quiz: [
            {
                id: 'q-structs-1',
                question: 'How does a type satisfy an interface in Go?',
                options: [
                    'By explicitly declaring implements',
                    'By implementing all interface methods',
                    'By extending a base class',
                    'By registering with the interface'
                ],
                correct: 1
            },
            {
                id: 'q-structs-2',
                question: 'When should you use a pointer receiver?',
                options: [
                    'Always — it is the default',
                    'When you need to modify the struct',
                    'Only for built-in types',
                    'Pointer receivers are not allowed'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'pointers-errors',
        title: 'Pointers & Error Handling',
        lessons: [
            {
                id: 'pointers-errors-1',
                title: 'Pointers',
                content: `
                    <h2>Pointers</h2>
                    <p>Go has pointers but no pointer arithmetic. They provide a way to pass references to values.</p>

                    <h3>Basic Pointers</h3>
                    <pre><code>func main() {
    x := 42
    p := &x          // p points to x
    fmt.Println(*p)  // read x through p — 42
    *p = 21          // set x through p
    fmt.Println(x)   // 21
}</code></pre>

                    <h3>Pointers vs Values</h3>
                    <pre><code>func zeroVal(val int) {
    val = 0  // modifies copy
}

func zeroPtr(ptr *int) {
    *ptr = 0  // modifies original
}

func main() {
    x := 5
    zeroVal(x)   // x is still 5
    zeroPtr(&x)  // x is now 0
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">No Pointer Arithmetic</div>
                        <p>Unlike C, Go does not allow arithmetic on pointers (no <code>p++</code>). This prevents common memory safety bugs like buffer overflows.</p>
                    </div>
                `,
                defaultCode: `package main

import "fmt"

func zeroVal(val int) {
    val = 0
}

func zeroPtr(ptr *int) {
    *ptr = 0
}

func main() {
    x := 5
    fmt.Println("Before:", x)
    zeroVal(x)
    fmt.Println("After zeroVal:", x)
    zeroPtr(&x)
    fmt.Println("After zeroPtr:", x)
}`
            },
            {
                id: 'pointers-errors-2',
                title: 'Error Handling',
                content: `
                    <h2>Error Handling</h2>
                    <p>Go handles errors explicitly via the built-in <code>error</code> type, which is returned as the last return value.</p>

                    <h3>The Error Pattern</h3>
                    <pre><code>func sqrt(x float64) (float64, error) {
    if x < 0 {
        return 0, errors.New("cannot sqrt negative")
    }
    return math.Sqrt(x), nil
}

func main() {
    result, err := sqrt(-1)
    if err != nil {
        fmt.Println("Error:", err)
    } else {
        fmt.Println("Result:", result)
    }
}</code></pre>

                    <h3>Custom Errors</h3>
                    <pre><code>type DivideError struct {
    Dividend float64
    Divisor  float64
}

func (e DivideError) Error() string {
    return fmt.Sprintf("cannot divide %.1f by %.1f", e.Dividend, e.Divisor)
}

func divide(x, y float64) (float64, error) {
    if y == 0 {
        return 0, DivideError{x, y}
    }
    return x / y, nil
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Explicit Error Handling</div>
                        <p>Go's explicit error handling makes error paths first-class citizens. Rather than try/catch blocks, you check errors at each step — leading to more predictable code.</p>
                    </div>
                `,
                defaultCode: `package main

import (
    "fmt"
    "errors"
)

func divide(x, y float64) (float64, error) {
    if y == 0 {
        return 0, errors.New("cannot divide by zero")
    }
    return x / y, nil
}

func main() {
    values := []float64{10, 0, 6}
    for i := 0; i < len(values)-1; i++ {
        result, err := divide(values[i], values[i+1])
        if err != nil {
            fmt.Println("Error:", err)
        } else {
            fmt.Printf("%.1f / %.1f = %.2f\\n", values[i], values[i+1], result)
        }
    }
}`
            }
        ],
        quiz: [
            {
                id: 'q-pointers-1',
                question: 'Can you perform arithmetic on Go pointers?',
                options: [
                    'Yes, like in C',
                    'No, Go does not allow pointer arithmetic',
                    'Only with unsafe package',
                    'Only on arrays'
                ],
                correct: 1
            },
            {
                id: 'q-pointers-2',
                question: 'How does Go handle errors?',
                options: [
                    'With try/catch blocks',
                    'By returning an error as a return value',
                    'With global error handlers',
                    'Errors are ignored by default'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'concurrency',
        title: 'Concurrency',
        lessons: [
            {
                id: 'concurrency-1',
                title: 'Goroutines',
                content: `
                    <h2>Goroutines</h2>
                    <p>Goroutines are lightweight threads managed by the Go runtime. They make concurrent programming simple and efficient.</p>

                    <h3>Starting a Goroutine</h3>
                    <p>Use the <code>go</code> keyword to launch a function in a new goroutine:</p>
                    <pre><code>func say(s string) {
    for i := 0; i < 3; i++ {
        time.Sleep(100 * time.Millisecond)
        fmt.Println(s)
    }
}

func main() {
    go say("world")
    say("hello")
}</code></pre>

                    <h3>WaitGroups</h3>
                    <p>Use <code>sync.WaitGroup</code> to wait for multiple goroutines:</p>
                    <pre><code>func worker(id int, wg *sync.WaitGroup) {
    defer wg.Done()
    fmt.Printf("Worker %d starting\\n", id)
    time.Sleep(time.Second)
    fmt.Printf("Worker %d done\\n", id)
}

func main() {
    var wg sync.WaitGroup
    for i := 1; i <= 3; i++ {
        wg.Add(1)
        go worker(i, &wg)
    }
    wg.Wait()
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Goroutines vs Threads</div>
                        <p>Goroutines start with tiny stacks (a few KB) and grow as needed. You can easily run tens of thousands of goroutines — something impossible with OS threads.</p>
                    </div>
                `,
                defaultCode: `package main

import (
    "fmt"
    "time"
)

func say(msg string) {
    for i := 0; i < 3; i++ {
        time.Sleep(50 * time.Millisecond)
        fmt.Println(msg)
    }
}

func main() {
    go say("async")
    say("sync")
}`
            },
            {
                id: 'concurrency-2',
                title: 'Channels',
                content: `
                    <h2>Channels</h2>
                    <p>Channels are Go's way of communicating between goroutines — "Do not communicate by sharing memory; instead, share memory by communicating."</p>

                    <h3>Basic Channels</h3>
                    <pre><code>func main() {
    ch := make(chan int)

    go func() {
        ch <- 42  // send
    }()

    value := <-ch  // receive
    fmt.Println(value)
}</code></pre>

                    <h3>Buffered Channels</h3>
                    <pre><code>func main() {
    ch := make(chan string, 2)
    ch <- "buffered"
    ch <- "channel"
    fmt.Println(<-ch)
    fmt.Println(<-ch)
}</code></pre>

                    <h3>Range and Close</h3>
                    <pre><code>func fibonacci(n int, ch chan int) {
    x, y := 0, 1
    for i := 0; i < n; i++ {
        ch <- x
        x, y = y, x+y
    }
    close(ch)
}

func main() {
    ch := make(chan int, 10)
    go fibonacci(10, ch)
    for i := range ch {
        fmt.Println(i)
    }
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Select Statement</div>
                        <p>The <code>select</code> statement lets a goroutine wait on multiple channel operations:</p>
                        <pre><code>select {
case msg1 := <-ch1:
    fmt.Println(msg1)
case msg2 := <-ch2:
    fmt.Println(msg2)
case <-time.After(1 * time.Second):
    fmt.Println("timeout")
}</code></pre>
                    </div>
                `,
                defaultCode: `package main

import "fmt"

func sum(s []int, c chan int) {
    total := 0
    for _, v := range s {
        total += v
    }
    c <- total
}

func main() {
    s := []int{7, 2, 8, -9, 4, 0}
    c := make(chan int)

    go sum(s[:len(s)/2], c)
    go sum(s[len(s)/2:], c)

    x, y := <-c, <-c
    fmt.Println(x, y, x+y)
}`
            }
        ],
        quiz: [
            {
                id: 'q-concurrency-1',
                question: 'What keyword starts a goroutine?',
                options: [
                    'thread',
                    'go',
                    'async',
                    'spawn'
                ],
                correct: 1
            },
            {
                id: 'q-concurrency-2',
                question: 'What is a channel used for?',
                options: [
                    'Storing data persistently',
                    'Communicating between goroutines',
                    'Managing memory allocation',
                    'Logging program output'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'packages-modules',
        title: 'Packages & Modules',
        lessons: [
            {
                id: 'packages-modules-1',
                title: 'Packages & Exports',
                content: `
                    <h2>Packages & Exports</h2>
                    <p>Go programs are organized into packages. A package is a collection of Go source files in the same directory.</p>

                    <h3>Package Declaration</h3>
                    <pre><code>// greeting/greeting.go
package greeting

import "fmt"

// Hello is exported (starts with capital letter)
func Hello(name string) string {
    return fmt.Sprintf("Hello, %s!", name)
}

// goodbye is not exported (starts with lowercase)
func goodbye(name string) string {
    return fmt.Sprintf("Goodbye, %s!", name)
}</code></pre>

                    <h3>Using Exported Names</h3>
                    <pre><code>// main.go
package main

import (
    "fmt"
    "example/greeting"
)

func main() {
    fmt.Println(greeting.Hello("Alice"))
    // greeting.goodbye("Bob")  // compile error: unexported
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Exported vs Unexported</div>
                        <p>In Go, visibility is controlled by the first letter of the name: uppercase means exported (public), lowercase means unexported (private to the package).</p>
                    </div>
                `,
                defaultCode: `package main

import (
    "fmt"
    "math"
)

func main() {
    fmt.Println("Pi:", math.Pi)
    fmt.Println("Sqrt(16):", math.Sqrt(16))
    fmt.Println("Pow(2, 10):", math.Pow(2, 10))
}`
            },
            {
                id: 'packages-modules-2',
                title: 'Go Modules & Dependency Management',
                content: `
                    <h2>Go Modules & Dependency Management</h2>
                    <p>Go modules are the standard way to manage dependencies. A module is defined by a <code>go.mod</code> file.</p>

                    <h3>Initializing a Module</h3>
                    <pre><code># Create a new module
go mod init example/myproject

# This creates a go.mod file:
module example/myproject

go 1.21</code></pre>

                    <h3>Adding Dependencies</h3>
                    <pre><code># Import a package in your code, then run:
go mod tidy

# Or explicitly add:
go get github.com/gorilla/mux</code></pre>

                    <h3>Creating a Simple CLI Tool</h3>
                    <pre><code>package main

import (
    "flag"
    "fmt"
)

func main() {
    name := flag.String("name", "World", "a name to greet")
    flag.Parse()
    fmt.Printf("Hello, %s!\\n", *name)
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Module Proxy</div>
                        <p>By default, Go uses a module mirror (proxy.golang.org) for faster, immutable dependency downloads. This ensures reproducible builds across environments.</p>
                    </div>
                `,
                defaultCode: `package main

import (
    "fmt"
    "os"
    "strings"
)

func main() {
    args := os.Args[1:]
    if len(args) == 0 {
        fmt.Println("Hello, World!")
        return
    }
    fmt.Printf("Hello, %s!\\n", strings.Join(args, " "))
}`
            }
        ],
        quiz: [
            {
                id: 'q-packages-1',
                question: 'How do you make a function accessible outside its package?',
                options: [
                    'Use the export keyword',
                    'Start the function name with a capital letter',
                    'Declare it in the main package',
                    'Add a public access modifier'
                ],
                correct: 1
            },
            {
                id: 'q-packages-2',
                question: 'What is the purpose of go.mod?',
                options: [
                    'To compile the program',
                    'To define the module and its dependencies',
                    'To run tests',
                    'To format the code'
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
        const lessonsCount = mod.lessons.length;
        const lessonsDoneCount = mod.lessons.filter(l => isItemComplete(l.id)).length;
        const quizCount = mod.quiz?.length || 0;
        const quizDone = quizCount > 0 ? isItemComplete(mod.id + '-quiz') : true;

        const allLessonsDone = lessonsDoneCount === lessonsCount;
        const isModuleComplete = allLessonsDone && quizDone;
        const hasPartialProgress = !allLessonsDone && lessonsDoneCount > 0;
        const isActive = mod.id === state.activeModuleId;

        let nodeClass = 'timeline-node--incomplete';
        if (isModuleComplete) nodeClass = 'timeline-node--complete';
        else if (hasPartialProgress) nodeClass = 'timeline-node--partial';
        else if (isActive) nodeClass = 'timeline-node--active';

        const activePart = isModuleComplete ? 'module-badge--complete'
            : isActive && !hasPartialProgress ? 'module-badge--active'
            : '';

        const checkVisible = isModuleComplete ? 'visible' : '';

        let progressHtml = '';
        if (hasPartialProgress) {
            progressHtml = `<span class="sidebar-lesson-progress">${lessonsDoneCount}/${lessonsCount} lessons done</span>`;
        } else if (allLessonsDone && !quizDone) {
            progressHtml = `<span class="sidebar-quiz-pending">Quiz not completed</span>`;
        }

        return `
            <li style="animation-delay: ${reducedMotion ? '0s' : idx * 0.03}s">
                <div class="timeline-node ${nodeClass}"></div>
                <button class="sidebar-module-btn ${isActive ? 'active' : ''}"
                        data-module-id="${mod.id}">
                    <div class="module-content-row">
                        <span class="module-badge ${activePart}">${String(idx + 1).padStart(2, '0')}</span>
                        <div class="module-text-group">
                            <span class="sidebar-module-title">${escHtml(mod.title)}</span>
                            ${progressHtml}
                        </div>
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

    DOM.lessonContent.innerHTML = lesson.content;

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
        DOM.outputFrame.innerHTML = '<div class="output-info">Please write some Go code first.</div>';
        return;
    }

    const logs = [];
    const errors = [];

    try {
        executeGoMock(code, logs, errors);
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

function executeGoMock(code, logs, errors) {
    const lines = code.split('\n');
    const vars = {};

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === '' || line.startsWith('//') || line.startsWith('package ') ||
            line.startsWith('import') || line.startsWith('(') || line.startsWith(')') ||
            line === '{' || line === '}' || line.startsWith('*') || line.startsWith('defer ') ||
            line.startsWith('type ') || line.startsWith('const ') || line.startsWith('go ')) {
            continue;
        }

        if (line.startsWith('func ') && line.endsWith('{')) {
            continue;
        }

        if (line.endsWith('{') || line === '}') {
            continue;
        }

        const shortDeclMatch = line.match(/^(\w+)\s*:=\s*(.+);?$/);
        if (shortDeclMatch) {
            const varName = shortDeclMatch[1];
            const value = evaluateGoExpr(shortDeclMatch[2], vars);
            vars[varName] = value;
            continue;
        }

        const varDeclMatch = line.match(/^var\s+(\w+)\s*(?:\w+)?\s*=\s*(.+);?$/);
        if (varDeclMatch) {
            const varName = varDeclMatch[1];
            const value = evaluateGoExpr(varDeclMatch[2], vars);
            vars[varName] = value;
            continue;
        }

        const printlnMatch = line.match(/^fmt\.Println\s*\((.+)\)$/);
        if (printlnMatch) {
            const args = splitGoArgs(printlnMatch[1]);
            const output = args.map(a => formatGoValue(evaluateGoExpr(a.trim(), vars))).join(' ');
            logs.push(output);
            continue;
        }

        const printfMatch = line.match(/^fmt\.Printf\s*\(\s*"((?:[^"\\]|\\.)*)"\s*,?\s*(.*)\)\s*$/);
        if (printfMatch) {
            let template = printfMatch[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t');
            if (printfMatch[2]) {
                const args = splitGoArgs(printfMatch[2]);
                let argIdx = 0;
                template = template.replace(/%[vsdfgt]/g, () => {
                    if (argIdx < args.length) {
                        return formatGoValue(evaluateGoExpr(args[argIdx++].trim(), vars));
                    }
                    return '%!';
                });
            }
            logs.push(template);
            continue;
        }

        const sprintfMatch = line.match(/^fmt\.Sprintf\s*\(/);
        if (sprintfMatch) {
            continue;
        }

        const errorfMatch = line.match(/^fmt\.Errorf\s*\(/);
        if (errorfMatch) {
            continue;
        }

        const ifMatch = line.match(/^if\s+(.+)\s+\{$/);
        if (ifMatch) continue;

        const elseMatch = line.match(/^else\s+/);
        if (elseMatch) continue;

        const forMatch = line.match(/^for\s+/);
        if (forMatch) continue;

        const rangeMatch = line.match(/^for\s+\w+,\s*\w+\s*:=\s*range\s+/);
        if (rangeMatch) continue;

        const returnMatch = line.match(/^return\s+/);
        if (returnMatch) continue;

        const switchMatch = line.match(/^switch\s+/);
        if (switchMatch) continue;

        const caseMatch = line.match(/^case\s+/);
        if (caseMatch) continue;

        const defaultMatch = line.startsWith('default:');
        if (defaultMatch) continue;

        const chDeclMatch = line.match(/^(\w+)\s*:=\s*make\(/);
        if (chDeclMatch) {
            const varName = chDeclMatch[1];
            vars[varName] = 'chan<internal>';
            continue;
        }

        if (line.startsWith('ch <- ')) {
            continue;
        }

        const chRecvMatch = line.match(/^(\w+)\s*:=\s*<-(.+)$/);
        if (chRecvMatch) {
            const varName = chRecvMatch[1];
            vars[varName] = 0;
            logs.push('(channel receive simulated: 0)');
            continue;
        }
    }
}

function evaluateGoExpr(expr, vars) {
    expr = expr.trim().replace(/;$/, '');

    if (vars[expr] !== undefined) return vars[expr];

    if ((expr.startsWith('"') && expr.endsWith('"')) ||
        (expr.startsWith("'") && expr.endsWith("'"))) {
        return expr.slice(1, -1);
    }

    if (expr.startsWith("`") && expr.endsWith("`")) {
        return expr.slice(1, -1);
    }

    if (/^-?\d+$/.test(expr)) {
        return parseInt(expr, 10);
    }

    if (/^-?\d+\.\d*$/.test(expr)) {
        return parseFloat(expr);
    }

    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'nil') return null;

    if (expr.startsWith('len(') && expr.endsWith(')')) {
        const inner = expr.slice(4, -1).trim();
        if (vars[inner] !== undefined) return 0;
        return 0;
    }

    if (expr.startsWith('make(')) {
        return 'make<internal>';
    }

    if (expr.includes('+') || expr.includes('-') || expr.includes('*') || expr.includes('/') || expr.includes('%')) {
        try {
            return evalSimpleMath(expr, vars);
        } catch {
            return expr;
        }
    }

    if (expr.startsWith('math.')) {
        const fnMatch = expr.match(/^math\.(\w+)\((.+)\)$/);
        if (fnMatch) {
            const fnName = fnMatch[1];
            const args = splitGoArgs(fnMatch[2]).map(a => evaluateGoExpr(a.trim(), vars));
            if (fnName === 'Pi') return 3.141592653589793;
            if (fnName === 'Sqrt') return Math.sqrt(args[0]);
            if (fnName === 'Pow') return Math.pow(args[0], args[1]);
            if (fnName === 'Sin') return Math.sin(args[0]);
            if (fnName === 'Cos') return Math.cos(args[0]);
            if (fnName === 'Floor') return Math.floor(args[0]);
            if (fnName === 'Ceil') return Math.ceil(args[0]);
        }
    }

    if (expr.startsWith('errors.New(')) {
        const msg = expr.slice(11, -1).replace(/"/g, '');
        return msg;
    }

    if (expr.startsWith('fmt.Sprintf(')) {
        return '(formatted string)';
    }

    if (expr.startsWith('fmt.Errorf(')) {
        return '(error string)';
    }

    if (expr.startsWith('strings.')) {
        return '(string op result)';
    }

    if (expr.startsWith('os.Args')) {
        return [];
    }

    if (expr.startsWith('[]')) {
        return [];
    }

    return expr;
}

function evalSimpleMath(expr, vars) {
    const tokens = expr.split(/([+\-*/%])/).map(t => t.trim()).filter(t => t);
    let result = typeof evaluateGoExpr(tokens[0], vars) === 'number'
        ? evaluateGoExpr(tokens[0], vars) : 0;
    for (let i = 1; i < tokens.length; i += 2) {
        const op = tokens[i];
        const right = evaluateGoExpr(tokens[i + 1], vars);
        const num = typeof right === 'number' ? right : parseFloat(right) || 0;
        switch (op) {
            case '+': result += num; break;
            case '-': result -= num; break;
            case '*': result *= num; break;
            case '/': result /= num; break;
            case '%': result %= num; break;
        }
    }
    return result;
}

function formatGoValue(val) {
    if (val === null) return 'nil';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'number') {
        if (Number.isInteger(val) && Math.abs(val) < 1e15) return String(val);
        return parseFloat(val.toFixed(6)).toString();
    }
    return String(val);
}

function splitGoArgs(argsStr) {
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
        if (ch === '"' && (current.endsWith('\\') || current.endsWith('\\\\'))) {
            current += ch;
            continue;
        }
        current += ch;
    }
    if (current.trim()) args.push(current.trim());
    return args;
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
                <i class="fa-solid fa-clipboard-check" style="font-size:3rem; color:#00add8; opacity:0.5; margin-bottom:1rem;"></i>
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
