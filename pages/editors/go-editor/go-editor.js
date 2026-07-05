document.addEventListener("DOMContentLoaded", () => {
  initGoEditor();
});

const GO_EXAMPLES = {
  hello: `package main

import "fmt"

func main() {
    fmt.Println("Hello Go!")
}`,

  vars: `package main

import "fmt"

func main() {
    var name = "Lakshay"
    age := 21

    fmt.Println(name)
    fmt.Println(age)
}`,

  slice: `package main

import "fmt"

func main() {
    fruits := []string{"Apple", "Banana", "Mango"}

    for _, f := range fruits {
        fmt.Println(f)
    }
}`,

  function: `package main

import "fmt"

func add(a int, b int) int {
    return a + b
}

func main() {
    fmt.Println(add(2, 3))
}`
};

/* SIMULATOR */
function simulateGo(code) {
  const output = [];

  if (!code.includes("fmt.Println")) {
    return {
      output: [],
      error: "No fmt.Println found"
    };
  }

  const lines = code.split("\n");

  for (let line of lines) {
    line = line.trim();

    let match = line.match(/fmt\.Println\((.*)\)/);
    if (match) {
      let val = match[1]
        .replace(/"/g, "")
        .replace(/'/g, "");

      output.push(val);
    }
  }

  return { output };
}

/* INIT */
function initGoEditor() {

  const editor = document.getElementById("goEditor");
  const output = document.getElementById("goOutput");
  const runBtn = document.getElementById("goRunBtn");
  const resetBtn = document.getElementById("goResetBtn");
  const copyBtn = document.getElementById("goCopyBtn");
  const select = document.getElementById("goExampleSelect");

  editor.value = GO_EXAMPLES.hello;

  select.addEventListener("change", () => {
    editor.value = GO_EXAMPLES[select.value];
  });

  runBtn.addEventListener("click", () => {
    const { output: out } = simulateGo(editor.value);
    output.innerHTML = out.map(v => `<div>${v}</div>`).join("");
  });

  resetBtn.addEventListener("click", () => {
    editor.value = GO_EXAMPLES[select.value];
  });

  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(editor.value);
  });
}
