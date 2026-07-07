let stack = [];
let queue = [];

const stackContainer = document.getElementById("stackContainer");
const queueContainer = document.getElementById("queueContainer");
const historyList = document.getElementById("historyList");

const stackMessage =
  document.getElementById("stackMessage");

const queueMessage =
  document.getElementById("queueMessage");

function addHistory(action) {
  const li = document.createElement("li");
  li.textContent = action;
  historyList.prepend(li);
}

function renderStack() {

  stackContainer.innerHTML = "";

  stack.forEach(value => {

    const element = document.createElement("div");

    element.className = "sqv-element";

    element.textContent = value;

    stackContainer.appendChild(element);

  });

}

function renderQueue() {

  queueContainer.innerHTML = "";

  queue.forEach(value => {

    const element = document.createElement("div");

    element.className = "sqv-element";

    element.textContent = value;

    queueContainer.appendChild(element);

  });

}

function pushElement() {

  const input = document.getElementById("stackInput");

  const value = input.value;

  if (!value) return;

  stack.push(value);

  addHistory(`Push(${value})`);

  renderStack();

  stackMessage.textContent =
    `Top Element: ${value}`;

  input.value = "";

}

function popElement() {

 if (stack.length === 0) {
  stackMessage.textContent = "Stack is empty";
  return;
}

  const removed = stack.pop();

  addHistory(`Pop() → ${removed}`);

  renderStack();

  if (stack.length > 0) {
  stackMessage.textContent =
    `Top Element: ${stack[stack.length - 1]}`;
} else {
  stackMessage.textContent =
    "Stack is empty";
}

}

function enqueueElement() {

  const input = document.getElementById("queueInput");

  const value = input.value;

  if (!value) return;

  queue.push(value);

  addHistory(`Enqueue(${value})`);

  renderQueue();

  queueMessage.textContent =
    `Rear Element: ${value}`;

  input.value = "";

}

function dequeueElement() {

 if (queue.length === 0) {
  queueMessage.textContent = "Queue is empty";
  return;
}
  const removed = queue.shift();

  addHistory(`Dequeue() → ${removed}`);

  renderQueue();
  if (queue.length > 0) {
  queueMessage.textContent =
    `Front Element: ${queue[0]}`;
} else {
  queueMessage.textContent =
    "Queue is empty";
}

}

document.getElementById("peekBtn").addEventListener("click", () => {

 if(stack.length === 0){
  stackMessage.textContent =
    "Stack is empty";
  return;
}

  stackMessage.textContent =
  `Top Element: ${stack[stack.length - 1]}`;
});

document.getElementById("frontBtn").addEventListener("click", () => {

  if(queue.length === 0){
  queueMessage.textContent =
    "Queue is empty";
  return;
}

 queueMessage.textContent =
  `Front Element: ${queue[0]}`;

});

document.getElementById("resetStackBtn").addEventListener("click", () => {

  stack = [];

  renderStack();

  addHistory("Stack Reset");
  stackMessage.textContent = "stack reset";

});

document.getElementById("resetQueueBtn").addEventListener("click", () => {

  queue = [];

  renderQueue();

  addHistory("Queue Reset");
  queueMessage.textContent = "queue reset";
});

document.getElementById("pushBtn")
  .addEventListener("click", pushElement);

document.getElementById("popBtn")
  .addEventListener("click", popElement);

document.getElementById("enqueueBtn")
  .addEventListener("click", enqueueElement);

document.getElementById("dequeueBtn")
  .addEventListener("click", dequeueElement);

addHistory("Visualizer initialized");