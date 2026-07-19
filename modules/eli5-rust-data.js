/**
 * ELI5 (Explain Like I'm 5) content for Rust Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5RustData = {
  // ─── Module 1: Ownership & Move Semantics ───

  'ownership-1': `
    <p><strong>Ownership</strong> is like having a <strong>single key to a locker</strong>.</p>
    <p>Imagine you have a locker at the swimming pool. You put your stuff in it and lock it with <strong>your key</strong>. Only you (the <strong>owner</strong>) can open it. When you hand the key to your friend, <strong>you no longer have it</strong> — your friend becomes the new owner. If you try to open the locker after giving away the key, you can't! The locker is now your friend's.</p>
    <p>That's exactly what Rust does with memory. Each piece of data has <strong>exactly one owner</strong> at a time. When you assign <code>s1</code> to <code>s2</code>, Rust says: "Okay, now <code>s2</code> owns this data. <code>s1</code>, you can't touch it anymore." This is called a <strong>move</strong>.</p>
    <p>When the owner goes away (the variable ends, like leaving the pool), Rust <strong>automatically cleans up</strong> the memory — like the locker automatically popping open when you leave. No garbage truck (garbage collector) needed!</p>
    <p><strong>In short:</strong> One owner at a time. When you move data, the old owner can't use it anymore. When the owner is done, memory is freed automatically.</p>
  `,

  'ownership-2': `
    <p><strong>Clone</strong> and <strong>Copy</strong> are two ways to <strong>duplicate</strong> data instead of moving it.</p>
    <p><strong>Clone</strong> is like using a <strong>photocopier</strong>. You have a drawing on paper, you put it in the copier, and you get a brand new copy. Now you have TWO drawings — you can give one to a friend and keep the other. The copier takes effort and time (just like <code>.clone()</code> takes memory and CPU).</p>
    <p><strong>Copy</strong> is like having a <strong>sticky note</strong> with a number written on it. If you want to share it, you can just write the same number on a new sticky note instantly — it's so small and simple that it's basically free. Numbers, true/false values, and characters are like sticky notes — they're so tiny that Rust just copies them automatically without asking.</p>
    <p>The rule: if something uses memory on the <strong>heap</strong> (like a long string or a big list), you can't automatically Copy it — you need to explicitly <code>.clone()</code>. If it lives entirely on the <strong>stack</strong> (like a number or a single character), Rust Copy's it automatically. Easy peasy!</p>
  `,

  // ─── Module 2: Borrowing & References ───

  'borrowing-1': `
    <p><strong>Borrowing</strong> is like <strong>looking at someone's book without taking it home</strong>.</p>
    <p>Your friend has a cool comic book. You can <strong>borrow</strong> it to read — you look at it while they hold it (<strong>immutable reference</strong> <code>&</code>). Many friends can look at the same book at the same time! Everyone can read it, no problem.</p>
    <p>But if you want to <strong>write</strong> in the book (add a drawing), you need a <strong>mutable reference</strong> (<code>&mut</code>). Only <strong>one person</strong> can write at a time, because it would be chaos if two people were drawing on the same page. And while someone is writing, nobody else can even read it — because what they're reading might change mid-sentence!</p>
    <p>That's Rust's borrowing rule in a nutshell:</p>
    <ul>
      <li>Lots of people can <strong>read</strong> at once (many <code>&T</code> references).</li>
      <li>Only <strong>one person</strong> can <strong>write</strong> (<code>&mut T</code>).</li>
      <li>You can't read AND write at the same time.</li>
    </ul>
    <p>The important part: when you borrow something, the owner <strong>still has it</strong>. You just get to look at it for a bit. No ownership transfer!</p>
  `,

  'borrowing-2': `
    <p><strong>Dangling references</strong> are like a <strong>phone number for a house that got demolished</strong>.</p>
    <p>You write down your friend's phone number. But what if their house gets knocked down and they move away? If you try to call that number, someone else might answer — or nobody at all! That's a <strong>dangling pointer</strong> in languages like C or C++ — you're pointing to memory that's already been given back.</p>
    <p>Rust is like a <strong>super-smart address book</strong> that checks: "Hey, is this house still standing?" before letting you call. If the house is gone, Rust <strong>won't even let your program run</strong>. It says: "Sorry, I can't let you call that number — the house was already demolished."</p>
    <p>In other languages, this causes crashes, security holes, and weird bugs. In Rust, it simply <strong>won't compile</strong>. The compiler acts like a protective parent — "You're not going out with that reference; it's way past its bedtime!"</p>
  `,

  // ─── Module 3: Lifetime Annotations ───

  'lifetimes-1': `
    <p><strong>Lifetimes</strong> are Rust's way of making sure a reference <strong>doesn't outlive the data</strong> it points to.</p>
    <p>Think of it like a <strong>library book</strong>. You borrow a book and there's a <strong>due date</strong> on it. The lifetime is that due date — "this book is valid until March 15th." If you try to read the book on March 20th, the library says: "Sorry, the book is due back — you can't use this reference anymore."</p>
    <p>Most of the time, Rust figures out the due dates <strong>automatically</strong>. But sometimes, when you have multiple references and Rust can't tell which one lives longest, you need to label them with <code>'a</code> (pronounced "<strong>tick-A</strong>").</p>
    <p>It's like putting name tags on kids at a camp: <code>'a</code> goes with group A, <code>'b</code> goes with group B. Rust checks that a reference tagged <code>'a</code> only lives as long as the data also tagged <code>'a</code>. If group A leaves at 3pm, you can't keep using their references at 4pm!</p>
    <p><strong>Don't worry</strong> — lifetimes look scary but Rust tells you exactly when you need them. Most Rust code barely uses explicit lifetimes!</p>
  `,

  'lifetimes-2': `
    <p><strong>Lifetime elision</strong> is a fancy word for "Rust <strong>figuring out lifetimes automatically</strong> so you don't have to type them."</p>
    <p>Imagine you're at a restaurant. You don't need to say "I'd like to eat food using my mouth, then swallow it with my throat, then digest it..." — you just say "I'll have the burger." The waiter <strong>already knows</strong> how eating works.</p>
    <p>Rust's <strong>elision rules</strong> are like that waiter. They're common-sense rules the compiler uses so you don't have to write boring lifetime labels everywhere:</p>
    <ol>
      <li>Each input gets its own lifetime label (automatic).</li>
      <li>If there's only one input, the output gets the same lifetime (obvious!).</li>
      <li>If one input is <code>&self</code> (a method on an object), the output gets that lifetime (makes sense!).</li>
    </ol>
    <p>So when you write <code>fn first_word(s: &str) -> &str</code>, Rust silently adds the lifetimes for you — like autocorrect for lifetimes!</p>
  `,

  // ─── Module 4: Structs, Enums & Pattern Matching ───

  'structs-enums-1': `
    <p><strong>Structs</strong> are like <strong>blank forms</strong> you design yourself.</p>
    <p>Imagine you want to collect information about your friends. You create a form with blanks: Name ___, Age ___, Favorite Color ___. That's a <strong>struct</strong>! You define the shape: "A Person has a name, an age, and a favorite color." Then you fill out the form for each friend — that's creating an <strong>instance</strong>.</p>
    <pre>struct Friend {
    name: String,
    age: u8,
    fav_color: String,
}

let alice = Friend {
    name: String::from("Alice"),
    age: 25,
    fav_color: String::from("purple"),
};</pre>
    <p><strong>Methods</strong> (inside <code>impl</code>) are like giving your form a <strong>brain</strong> — things it can DO. Like "calculate how many years until retirement" or "say hello." The <code>&self</code> in a method is just a way of saying "use THIS specific friend's data."</p>
    <p>Think of it like a Tamagotchi pet — you create it (struct), it has properties like hunger and happiness (fields), and it can do actions like eat and play (methods).</p>
  `,

  'structs-enums-2': `
    <p><strong>Enums</strong> are like a <strong>menu</strong> — you pick <strong>one option</strong> from a list of possibilities.</p>
    <p>An enum is perfect when something can be one of several different things. Think of a traffic light: it can be <strong>Red</strong>, <strong>Yellow</strong>, or <strong>Green</strong>. Not all three at once! That's an enum.</p>
    <pre>enum TrafficLight {
    Red,
    Yellow,
    Green,
}</pre>
    <p>The cool part: Rust enums can also <strong>carry data</strong> with each option. Like a menu item that comes with sides: "Burger with fries" vs "Pizza with a drink." Each option can hold different types of extra info.</p>
    <p><strong>Pattern matching</strong> (the <code>match</code> keyword) is like a <strong>sorting machine</strong>. You put something on the conveyor belt, and depending on what it is, a different arm grabs it. If it's Red → Stop. If it's Green → Go. Rust <strong>forces you</strong> to handle every possible option — you can't forget one. This eliminates tons of bugs!</p>
  `,

  // ─── Module 5: Traits & Generics ───

  'traits-1': `
    <p><strong>Traits</strong> are like <strong>skill certificates</strong> — they say "this thing CAN do something."</p>
    <p>Imagine you have different animals: a Dog, a Cat, and a Bird. They all have the skill "make a sound." But each makes a DIFFERENT sound — the dog barks, the cat meows, the bird chirps. A <strong>trait</strong> is like saying: "If you have the <strong>Speaker</strong> certificate, you must know how to make a sound."</p>
    <pre>trait Speaker {
    fn make_sound(&self) -> String;
}

impl Speaker for Dog {
    fn make_sound(&self) -> String { "Woof!".to_string() }
}

impl Speaker for Cat {
    fn make_sound(&self) -> String { "Meow!".to_string() }
}</pre>
    <p><strong>Generics</strong> are like writing a <strong>recipe</strong> that works with ANYTHING that meets the requirements. Instead of writing "Dog feeder" and "Cat feeder" separately, you write one "Animal feeder" that works for any animal with the Speaker skill.</p>
    <p><strong>Trait bounds</strong> (<code>T: Speaker</code>) means: "I don't care about the specific type, as long as it has the Speaker certificate." Like saying "I'll accept any food as long as it's edible!"</p>
  `,

  'traits-2': `
    <p><strong>Trait objects</strong> are like a <strong>mixed bag of toys</strong> that can all make noise.</p>
    <p>Imagine you have a box of toys. Each toy can make a sound — the duck quacks, the car vrooms, the bell rings. You want to go through the box and make each toy do its sound without caring which toy is which.</p>
    <p><strong>Static dispatch</strong> (<code>&impl Trait</code>) is like saying: "I'll make a separate button for each toy type. Duck button goes 'quack', Car button goes 'vroom'." It's fast but creates a button for every type.</p>
    <p><strong>Dynamic dispatch</strong> (<code>&dyn Trait</code>) is like having a <strong>universal "play" button</strong> — press it and whatever toy is in your hand makes its sound. It's slightly slower (you have to look up "how does THIS toy make sound?" each time) but way more flexible.</p>
    <p>Use <code>impl</code> when you know the type (faster). Use <code>dyn</code> when you have a mix of different types in a collection — like a Vec of different animals all stored in <code>Box</code>es.</p>
  `,

  // ─── Module 6: Error Handling ───

  'error-handling-1': `
    <p>Rust doesn't use <strong>exceptions</strong> (like try/catch in other languages). Instead, it uses two special types: <strong>Option</strong> and <strong>Result</strong>.</p>
    <p><strong>Option</strong> is like asking "Is there milk in the fridge?" — the answer is either <strong>Some(milk)</strong> (yes, here it is!) or <strong>None</strong> (nope, fridge is empty). There's no "maybe the fridge exploded" — just yes or no.</p>
    <p><strong>Result</strong> is like asking "Can you divide 10 by 0?" — the answer is either <strong>Ok(3.33)</strong> (here's your answer!) or <strong>Err("can't divide by zero")</strong> (nope, that's impossible!).</p>
    <p>The magic: Rust <strong>forces you</strong> to handle both cases. When a function returns <code>Option</code> or <code>Result</code>, you <strong>must</strong> check if it's <code>Some</code>/<code>Ok</code> or <code>None</code>/<code>Err</code> before using the value. This means:</p>
    <ul>
      <li><strong>No null pointer crashes!</strong> (Null doesn't exist in Rust).</li>
      <li><strong>No unhandled exceptions!</strong> (You can't forget to handle an error).</li>
    </ul>
    <p>It's like a package that says "OPEN HERE" on both sides. You can't ignore it — you have to look at what's inside!</p>
  `,

  'error-handling-2': `
    <p>The <strong>?</strong> operator is like a <strong>trap door</strong> for errors.</p>
    <p>Imagine you're in a maze. At each door, you check: "Is this door open?" If yes, you walk through. If no, instead of writing a big speech about what happened, you just <strong>fall through a trap door</strong> that takes you straight back to the start of the maze, saying "couldn't get through that door!"</p>
    <p>Without <code>?</code>, error checking looks like this (lots of typing!):</p>
    <pre>fn read_file(path: &str) -> Result&lt;String, Error&gt; {
    let result = fs::read_to_string(path);
    match result {
        Ok(content) => Ok(content),
        Err(e) => return Err(e),  // ugh, so much typing!
    }
}</pre>
    <p>With <code>?</code>, it's just:</p>
    <pre>fn read_file(path: &str) -> Result&lt;String, Error&gt; {
    Ok(fs::read_to_string(path)?)  // trap door!
}</pre>
    <p>The <code>?</code> says: "If this thing succeeds, give me the value. If it fails, <strong>immediately return the error</strong> to whoever called me." It's like having a smart assistant who handles all the "what if it breaks?" checks so you can write clean, simple code.</p>
    <p>But remember: <code>?</code> only works inside functions that return <code>Result</code> or <code>Option</code>. You can't use it in <code>main()</code> ... unless you make main return a <code>Result</code> too!</p>
  `,

  // ─── Module 7: Fearless Concurrency ───

  'concurrency-1': `
    <p><strong>Threads</strong> are like having <strong>multiple chefs in a kitchen</strong> cooking at the same time.</p>
    <p>One chef chops vegetables, another boils pasta, a third stirs sauce. They all work at the same time (<strong>concurrently</strong>), and the meal gets done much faster!</p>
    <p><strong>Message passing</strong> is like chefs using <strong>passing notes</strong> or <strong>shouting orders</strong>. Chef A says "Pasta is ready!" and Chef B hears it and starts plating. They communicate through <strong>channels</strong> (<code>mpsc::channel</code>) — like a tube that sends messages from one end to the other.</p>
    <pre>// One chef sends a note:
tx.send("Pasta is ready!").unwrap();

// Another chef receives it:
let msg = rx.recv().unwrap();</pre>
    <p>Rust is special because it <strong>prevents data races</strong> at compile time. A data race is when two chefs try to grab the same tomato at the same time — one chops, the other slices, and chaos ensues. Rust's <strong>ownership rules</strong> ensure that when you send data to a thread, the original thread can no longer use it. It's like saying: "You take this tomato, it's YOURS now. The other chef can't touch it."</p>
    <p><strong>Fearless concurrency</strong> means: write multi-threaded code without fear of crashes or weird bugs. Rust has your back!</p>
  `,

  'concurrency-2': `
    <p><strong>Mutex</strong> and <strong>Arc</strong> are tools for when multiple threads need to <strong>share the same data</strong>.</p>
    <p><strong>Mutex</strong> (Mutual Exclusion) is like a <strong>bathroom with a lock</strong>. Only one person can use the bathroom at a time. You go in, lock the door (<code>lock()</code>), do your business, and unlock when you leave. If someone else tries to enter while it's locked, they <strong>wait</strong> until it's free. The <code>Mutex</code> wraps your data and says: "Only one thread can access this at a time."</p>
    <p><strong>Arc</strong> (Atomic Reference Counting) is like having a <strong>TV remote that clones itself</strong>. You and your siblings each get a clone of the remote, but there's still only ONE TV. Each remote clone knows how many people are watching. When the last person stops watching, the TV turns off automatically. <code>Arc</code> lets multiple threads hold a reference to the same data, counting how many references exist, and cleaning up when there are none.</p>
    <p>Together, <code>Arc&lt;Mutex&lt;T&gt;&gt;</code> is like giving each sibling a bathroom key (remote) that works on the same bathroom. Only one uses it at a time, and the bathroom gets cleaned up when everyone goes home!</p>
  `,

  // ─── Module 8: Unsafe Rust ───

  'unsafe-rust-1': `
    <p><strong>Unsafe Rust</strong> is like a <strong>power tool with the safety guard removed</strong>.</p>
    <p>Most of the time, you use regular tools (screwdrivers, hammers) that have <strong>safety features</strong> built in — Rust's compiler checks everything for you. But sometimes you need to do something the safe tools can't do, like talking to another program in a different language (FFI), or doing super-fast memory tricks for performance.</p>
    <p>When you write <code>unsafe { }</code>, you're saying: "<strong>I know what I'm doing, I promise!</strong>" It's like taking the safety guard off a saw because you need to cut a weird shape. You CAN do it, but you better be careful — there's no safety net anymore!</p>
    <p><strong>Raw pointers</strong> (<code>*const T</code> and <code>*mut T</code>) are like <strong>writing down a house address on a sticky note</strong> without checking if the house exists. In safe Rust, the compiler always checks: "Is that house still standing?" In unsafe, it says: "You said you'd check. I'll trust you."</p>
    <p>The golden rule: keep <code>unsafe</code> blocks <strong>small</strong> — like using a power tool for just one cut, not the whole project. And always <strong>document WHY</strong> you used unsafe, so future you (or other developers) know what promise you made!</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5RustData = eli5RustData;
