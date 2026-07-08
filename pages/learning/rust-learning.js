const rustExamples = {
  hello: `fn main() {
    println!("Hello, Rust!");
}`,

  ownership: `fn main() {
    let name = String::from("Rust");
    borrow_name(&name);
    println!("Original value: {}", name);
}

fn borrow_name(value: &String) {
    println!("Borrowed value: {}", value);
}`,

  structs: `enum Role {
    Student,
    Developer,
}

struct User {
    name: String,
    role: Role,
}

fn main() {
    let user = User {
        name: String::from("Learner"),
        role: Role::Developer,
    };

    println!("User: {}", user.name);
}`,

  concurrency: `use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..4 {
            println!("Thread count: {}", i);
        }
    });

    handle.join().unwrap();
    println!("Main thread finished");
}`,
};

function initRustPlayground() {
  const rustEditor = document.getElementById("rustEditor");
  const rustOutput = document.getElementById("rustOutput");
  const rustExampleSelect = document.getElementById("rustExampleSelect");
  const runRustBtn = document.getElementById("runRustBtn");
  const resetRustBtn = document.getElementById("resetRustBtn");
  const clearRustOutputBtn = document.getElementById("clearRustOutputBtn");

  if (!rustEditor || !rustOutput) return;

  function loadRustExample(exampleKey = "hello") {
    rustEditor.value = rustExamples[exampleKey];
    localStorage.setItem("rustCode", rustEditor.value);
  }

  const savedRustCode = localStorage.getItem("rustCode");

  if (savedRustCode !== null) {
    rustEditor.value = savedRustCode;
  } else {
    loadRustExample("hello");
  }

  rustEditor.addEventListener("input", () => {
    localStorage.setItem("rustCode", rustEditor.value);
  });

  rustExampleSelect?.addEventListener("change", () => {
    loadRustExample(rustExampleSelect.value);
  });

  resetRustBtn?.addEventListener("click", () => {
    loadRustExample(rustExampleSelect?.value);
  });

  clearRustOutputBtn?.addEventListener("click", () => {
    rustOutput.textContent = "Output will appear here...";
  });

  runRustBtn?.addEventListener("click", runRustCode);
}

document.addEventListener("DOMContentLoaded", initRustPlayground);

async function runRustCode() {
  const rustEditor = document.getElementById("rustEditor");
  const rustOutput = document.getElementById("rustOutput");
  const code = rustEditor?.value.trim();

  if (!code) {
    rustOutput.textContent = "Please write some Rust code first.";
    return;
  }

  rustOutput.textContent =
    "Rust execution API is not configured yet.\n\n" +
    "The playground UI is ready with editor, examples, reset, clear output, and localStorage.\n\n" +
    "To enable execution, configure Judge0, a backend proxy, or self-hosted Piston.";
}
