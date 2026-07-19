/**
 * ELI5 (Explain Like I'm 5) content for Go Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5GoData = {
  // ─── Module 1: Go Fundamentals ───

  'go-fundamentals-1': `
    <p>A <strong>Go program</strong> is like a <strong>school play</strong>. Every play needs a stage (the <code>main</code> package) and a starting scene (the <code>main()</code> function).</p>
    <p>When you write <code>package main</code>, you're telling Go: "This is the main show, not just a prop or a costume!"</p>
    <p><code>import "fmt"</code> is like bringing in a <strong>microphone and speaker system</strong> — you can't announce anything to the audience without it! The <code>fmt</code> package lets you print things out.</p>
    <p><code>func main()</code> is the <strong>curtain opening</strong> — everything starts here. It's the very first scene that runs when the play begins.</p>
    <p><code>fmt.Println("Hello, World!")</code> is like the actor walking on stage and saying their first line to the audience.</p>
    <p><strong>In short:</strong> <code>package main</code> = this is the show. <code>func main()</code> = start here. <code>fmt.Println</code> = say something to the audience.</p>
  `,

  'go-fundamentals-2': `
    <p><strong>Variables</strong> are like <strong>labeled boxes</strong> where you store things. Each box has a name and can only hold a specific type of item.</p>
    <p>There are two ways to make a box in Go:</p>
    <ul>
      <li><strong>Explicit declaration</strong> (<code>var name string = "Alice"</code>) — like getting a box, writing "STRING" on it in big letters, and putting "Alice" inside. You're very clear about what goes in there.</li>
      <li><strong>Short declaration</strong> (<code>name := "Alice"</code>) — like getting a box and just tossing "Alice" in. Go looks at what you put in and writes the label for you. "Oh, that's a string!"</li>
    </ul>
    <p><strong>Zero values</strong> are like <strong>empty lunchboxes</strong>. If you bring a lunchbox to school but forget to pack anything, it's not nothing — it's EMPTY. Numbers default to <code>0</code>, text defaults to <code>""</code> (empty string), and true/false defaults to <code>false</code>. Every box always has SOMETHING in Go — there's no such thing as a truly empty box!</p>
  `,

  // ─── Module 2: Control Flow & Functions ───

  'control-functions-1': `
    <p><strong>If/else</strong> is like a <strong>fork in the road</strong>. If it's raining, take the umbrella path. Else, walk without it.</p>
    <p>Go keeps it simple — no parentheses needed around conditions. It's like saying "If rainy, grab umbrella" without any extra fluff words.</p>
    <p><strong>For loops</strong> are the <strong>only loop</strong> in Go — it does everything! It's like a Swiss Army knife:</p>
    <ul>
      <li><strong>Classic for</strong> (<code>for i := 0; i < 5; i++</code>) — like counting "1, 2, 3, 4, 5" on your fingers. Start at 0, keep going while less than 5, add 1 each time.</li>
      <li><strong>While-style</strong> (<code>for sum < 100</code>) — like saying "keep doubling your money until you have at least $100." No counter needed, just keep going until the condition is met.</li>
      <li><strong>Infinite loop</strong> (<code>for {}</code>) — like a merry-go-round that never stops unless you jump off (<code>break</code>).</li>
    </ul>
    <p><strong>Switch</strong> is like a <strong>sorting machine</strong> at a post office — the mail goes in, and depending on the zip code, it goes to a different chute. No need to add <code>break</code> after each option — Go automatically stops after the first match!</p>
  `,

  'control-functions-2': `
    <p><strong>Functions</strong> are like <strong>recipes</strong>. You give them ingredients (parameters), they follow steps, and they give you back something delicious (return value).</p>
    <p><strong>Multiple return values</strong> are Go's superpower! In most languages, a recipe can only give you ONE thing back. But Go says: "Here's your cake, AND here's the recipe's calorie count, AND here's a tip on how to make it better!"</p>
    <p>The most common use: returning a <strong>result AND an error</strong>. Like trying to divide by zero — the function says: "Here's 0 as the result (sorry), AND here's an explanation: 'You can't divide by zero!'"</p>
    <p><strong>Named return values</strong> are like pre-labeling your output containers before you start cooking. Instead of saying "return the sum," you already labeled the container <code>x</code> and <code>y</code>. A <strong>naked return</strong> (<code>return</code> without values) just grabs whatever's in the labeled containers — like saying "Dinner's ready!" and the labeled dishes serve themselves!</p>
  `,

  // ─── Module 3: Structs & Interfaces ───

  'structs-interfaces-1': `
    <p><strong>Structs</strong> are like <strong>blank forms</strong> you design yourself. Think of a library card application — it has blanks for Name, Age, and Phone Number. That's a struct!</p>
    <pre>type Person struct {
        Name string
        Age  int
    }</pre>
    <p>Once you've designed the form, you can fill it out for each person: <code>Person{"Alice", 30}</code>.</p>
    <p><strong>Methods</strong> are like adding a <strong>stamp</strong> or <strong>action</strong> to the form. "This form can also CALCULATE something." In Go, you write a method by specifying a <strong>receiver</strong> — the thing the method belongs to.</p>
    <ul>
      <li><strong>Value receiver</strong> (<code>func (r Rectangle) Area()</code>) — like LOOKING at a rectangle to measure its area. You don't change the rectangle, you just read its dimensions.</li>
      <li><strong>Pointer receiver</strong> (<code>func (r *Rectangle) Scale()</code>) — like GRABBING the rectangle and stretching it. You're changing the actual rectangle, not just looking at it.</li>
    </ul>
    <p>Go doesn't have classes like other languages — structs + methods IS its version of classes, but simpler. No inheritance headaches!</p>
  `,

  'structs-interfaces-2': `
    <p><strong>Interfaces</strong> are like <strong>job descriptions</strong>. They say: "Anyone who wants this job MUST be able to do these tasks."</p>
    <p>For example, a <strong>Shape</strong> interface says: "To be a shape, you must be able to calculate your <code>Area()</code> and <code>Perimeter()</code>."</p>
    <p>A <strong>Circle</strong> says: "I can calculate Area and Perimeter. I'm a Shape!" A <strong>Rectangle</strong> says the same thing. Neither needs to explicitly say "I implement Shape" — Go just checks: "Can you do what a Shape does? Great, you're a Shape!"</p>
    <p>This is called <strong>implicit satisfaction</strong> — if it walks like a duck and quacks like a duck, it IS a duck. No paperwork needed!</p>
    <p><strong>Composition over inheritance</strong> is Go's way of saying: "Instead of inheriting from a parent class (which is like saying 'I'm a specialized version of Animal'), just EMBED one struct inside another (like snapping LEGO blocks together)."</p>
    <p>An <code>Employee</code> struct can embed <code>Person</code> — the employee automatically gets the person's Name and Age. It's like adding a "Personal Info" section to your employee form without rewriting everything!</p>
  `,

  // ─── Module 4: Pointers & Error Handling ───

  'pointers-errors-1': `
    <p><strong>Pointers</strong> are like <strong>house addresses</strong>. Instead of carrying the actual house around, you carry a piece of paper with the address written on it.</p>
    <p>When you write <code>p := &x</code>, you're saying: "Give me the address of variable x's house." Then <code>*p</code> means: "Go to that address and see what's inside."</p>
    <p>The difference between passing by <strong>value</strong> vs <strong>pointer</strong>:</p>
    <ul>
      <li><strong>Pass by value</strong> (<code>zeroVal(x)</code>) — like photocopying your homework and giving the copy to the teacher. The teacher can scribble all over the copy, but YOUR original is untouched.</li>
      <li><strong>Pass by pointer</strong> (<code>zeroPtr(&x)</code>) — like giving the teacher your ACTUAL homework folder. Anything they change changes YOUR original!</li>
    </ul>
    <p>Go is super safe about pointers — you can't do <strong>pointer arithmetic</strong> (no <code>p++</code> to move to the "next house"). In C, you can accidentally wander into random memory neighborhoods and cause chaos. Go says: "You get the address. That's it. No walking around."</p>
  `,

  'pointers-errors-2': `
    <p>Go doesn't use <strong>try/catch</strong> like other languages. Instead, errors are just <strong>return values</strong> — like a receipt that says "Here's your purchase, AND here's whether it worked or not."</p>
    <p>The pattern is always the same:</p>
    <pre>result, err := doSomething()
    if err != nil {
        // Handle the problem
    }</pre>
    <p>This is like a vending machine that gives you TWO things: your snack AND a note. If the note says "Sorry, out of stock" (<code>err != nil</code>), you know something went wrong. If the note is blank (<code>nil</code>), enjoy your snack!</p>
    <p><strong>Custom errors</strong> are like creating your own specific problem notes. Instead of a generic "Something went wrong," you can say: "Cannot divide 10.0 by 0.0" — much more helpful!</p>
    <p>The beauty of Go's approach: you NEVER forget to check for errors because they're right there in the return values. It's like getting a package that says "OPEN HERE" on both sides — you can't ignore it!</p>
  `,

  // ─── Module 5: Concurrency ───

  'concurrency-1': `
    <p><strong>Goroutines</strong> are like having <strong>extra helpers in the kitchen</strong>. You're cooking, and you can say "Hey, go chop those vegetables!" — and while they're chopping, you keep stirring the soup. Both tasks happen at the same time!</p>
    <p>In Go, you just add the word <code>go</code> in front of any function call: <code>go chopVegetables()</code>. That's it! The function runs in its own <strong>goroutine</strong> — a super lightweight "helper" that costs almost nothing to create.</p>
    <p>Unlike regular computer threads (which are like hiring full-time staff with big salaries and offices), goroutines are like hiring interns with tiny desks. You can hire THOUSANDS of them without breaking the bank!</p>
    <p><strong>WaitGroups</strong> (<code>sync.WaitGroup</code>) are like a <strong>checklist</strong> for your helpers. You say: "I need 3 people to help" (<code>wg.Add(3)</code>). Each helper, when done, checks off their name (<code>wg.Done()</code>). You wait at the door until all three have checked off (<code>wg.Wait()</code>), then you all go home together.</p>
  `,

  'concurrency-2': `
    <p><strong>Channels</strong> are like <strong>talking tubes</strong> between your kitchen helpers. Instead of sharing a messy fridge (shared memory), one chef puts a finished dish into the tube, and another chef takes it out on the other end.</p>
    <p><code>ch := make(chan int)</code> creates a tube that can pass numbers. <code>ch <- 42</code> sends the number 42 into the tube. <code>value := <-ch</code> takes a number out of the tube.</p>
    <p><strong>Unbuffered channels</strong> are like a <strong>single-plate pass-through window</strong> — the chef puts a plate in and waits until someone takes it on the other side before making the next dish. Both sides have to be ready at the same time!</p>
    <p><strong>Buffered channels</strong> (<code>make(chan int, 2)</code>) are like a <strong>sushi conveyor belt</strong> that can hold up to 2 plates. The chef can put up to 2 plates on the belt without waiting, then has to wait until someone takes one before adding more.</p>
    <p><strong>Select</strong> is like a <strong>traffic controller</strong> watching multiple conveyor belts at once. Whichever belt has a plate ready first gets served. If both are ready, it picks one randomly — no favoritism!</p>
  `,

  // ─── Module 6: Packages & Modules ───

  'packages-modules-1': `
    <p><strong>Packages</strong> are like <strong>folders in your school binder</strong>. You have one folder for Math homework, one for Science, one for English. Each folder keeps related papers together and has its own label.</p>
    <p>In Go, every file starts with <code>package something</code> — it's like writing "MATH" on the folder tab. Files in the same folder MUST have the same package name.</p>
    <p><strong>Exported vs unexported names</strong> is like the <strong>difference between public library books and your private diary</strong>:</p>
    <ul>
      <li><strong>Capital letter</strong> (<code>Hello</code>) = public library book. Anyone from other packages can check it out and use it.</li>
      <li><strong>Lowercase letter</strong> (<code>goodbye</code>) = your private diary. Only you (your package) can see it. Other packages get a compile error if they try to peek.</li>
    </ul>
    <p>It's that simple! No <code>public</code>, <code>private</code>, <code>protected</code> keywords. Just uppercase = public, lowercase = private. Go keeps things simple!</p>
  `,

  'packages-modules-2': `
    <p><strong>Go modules</strong> are like a <strong>shopping list and a pantry</strong> for your code.</p>
    <p><code>go.mod</code> is the <strong>shopping list</strong> — it says "My project needs these ingredients (other people's code) to work." When you run <code>go mod tidy</code>, Go goes to the supermarket (the module mirror at proxy.golang.org) and gets exactly what's on the list.</p>
    <p><code>go get github.com/gorilla/mux</code> is like adding "Gorilla Mux cereal" to your shopping list. Go downloads it and adds it to your <code>go.mod</code> automatically.</p>
    <p>The <strong>module proxy</strong> (proxy.golang.org) is like a <strong>giant warehouse</strong> that stores every version of every package ever made. When you build your project, Go doesn't go to each individual package's house — it goes to the warehouse where everything is organized and available instantly. This means your build is <strong>reproducible</strong> — it works the same today, tomorrow, and next year, because the warehouse keeps every version forever!</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5GoData = eli5GoData;
