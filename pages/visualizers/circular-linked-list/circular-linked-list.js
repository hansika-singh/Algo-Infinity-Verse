// ============================================
// CIRCULAR LINKED LIST SIMULATOR
// ============================================

class CircularLinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
        this.size = 0;
        this.colors = [
            '#667eea', '#764ba2', '#f7971e', '#ffd200',
            '#2ed573', '#36a4eb', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#a8c0ff', '#3f2b96'
        ];
    }

    createNode(value) {
        return { value, next: null };
    }

    getColor(index) {
        return this.colors[index % this.colors.length];
    }

    insertAtBeginning(value) {
        const newNode = this.createNode(value);
        
        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
            newNode.next = newNode;
        } else {
            newNode.next = this.head;
            this.tail.next = newNode;
            this.head = newNode;
        }
        
        this.size++;
        this.render();
        showMessage(`Inserted ${value} at beginning ✅`, 'success');
    }

    insertAtEnd(value) {
        const newNode = this.createNode(value);
        
        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
            newNode.next = newNode;
        } else {
            newNode.next = this.head;
            this.tail.next = newNode;
            this.tail = newNode;
        }
        
        this.size++;
        this.render();
        showMessage(`Inserted ${value} at end ✅`, 'success');
    }

    insertAtPosition(value, position) {
        if (position < 0 || position > this.size) {
            showMessage('Invalid position! ❌', 'error');
            return;
        }
        
        if (position === 0) { this.insertAtBeginning(value); return; }
        if (position === this.size) { this.insertAtEnd(value); return; }
        
        const newNode = this.createNode(value);
        let current = this.head;
        
        for (let i = 0; i < position - 1; i++) {
            current = current.next;
        }
        
        newNode.next = current.next;
        current.next = newNode;
        this.size++;
        this.render();
        showMessage(`Inserted ${value} at position ${position} ✅`, 'success');
    }

    deleteNode(value) {
        if (!this.head) {
            showMessage('List is empty! ❌', 'error');
            return;
        }
        
        let current = this.head;
        let prev = this.tail;
        
        if (this.head.value === value) {
            if (this.size === 1) {
                this.head = null;
                this.tail = null;
            } else {
                this.head = this.head.next;
                this.tail.next = this.head;
            }
            this.size--;
            this.render();
            showMessage(`Deleted ${value} ✅`, 'success');
            return;
        }
        
        do {
            if (current.value === value) {
                prev.next = current.next;
                if (current === this.tail) {
                    this.tail = prev;
                }
                this.size--;
                this.render();
                showMessage(`Deleted ${value} ✅`, 'success');
                return;
            }
            prev = current;
            current = current.next;
        } while (current !== this.head);
        
        showMessage(`Value ${value} not found! ❌`, 'error');
    }

    deleteAtPosition(position) {
        if (position < 0 || position >= this.size || !this.head) {
            showMessage('Invalid position! ❌', 'error');
            return;
        }
        
        let value;
        if (position === 0) {
            value = this.head.value;
            if (this.size === 1) {
                this.head = null;
                this.tail = null;
            } else {
                this.head = this.head.next;
                this.tail.next = this.head;
            }
        } else {
            let current = this.head;
            let prev = this.tail;
            for (let i = 0; i < position; i++) {
                prev = current;
                current = current.next;
            }
            value = current.value;
            prev.next = current.next;
            if (current === this.tail) {
                this.tail = prev;
            }
        }
        
        this.size--;
        this.render();
        showMessage(`Deleted ${value} at position ${position} ✅`, 'success');
    }

    traverse() {
        if (!this.head) {
            showMessage('List is empty! ❌', 'error');
            return;
        }
        
        let current = this.head;
        let steps = 0;
        const maxSteps = this.size * 2;
        let visited = new Set();
        
        showMessage('Traversing circular list... 🔄', 'info');
        
        const interval = setInterval(() => {
            if (steps >= maxSteps || visited.has(current)) {
                clearInterval(interval);
                this.render();
                showMessage('Traversal complete! ✅', 'success');
                return;
            }
            
            visited.add(current);
            this.render();
            highlightNode(current);
            current = current.next;
            steps++;
        }, 600);
    }

    josephusDemo(step = 2) {
        if (this.size === 0) {
            showMessage('List is empty! Add some nodes first. ❌', 'error');
            return;
        }
        
        let current = this.head;
        let prev = this.tail;
        let remaining = this.size;
        let removedNodes = [];
        let tempList = this.copyList();
        
        showMessage(`Josephus Problem (step ${step})... 🎯`, 'info');
        
        const interval = setInterval(() => {
            if (remaining <= 1) {
                clearInterval(interval);
                this.render();
                showMessage(`🏆 Survivor: ${current.value} 🎉`, 'success');
                return;
            }
            
            for (let i = 0; i < step - 1; i++) {
                prev = current;
                current = current.next;
            }
            
            const removed = current.value;
            removedNodes.push(removed);
            
            if (current === this.head) {
                this.head = current.next;
            }
            prev.next = current.next;
            if (current === this.tail) {
                this.tail = prev;
            }
            
            current = current.next;
            remaining--;
            this.size--;
            
            this.render();
            showMessage(`Removed: ${removed} 💀`, 'info');
            
            if (remaining === 1) {
                clearInterval(interval);
                setTimeout(() => {
                    this.render();
                    showMessage(`🏆 Survivor: ${current.value} 🎉`, 'success');
                }, 500);
            }
        }, 800);
    }

    copyList() {
        const newList = new CircularLinkedList();
        if (!this.head) return newList;
        
        let current = this.head;
        do {
            newList.insertAtEnd(current.value);
            current = current.next;
        } while (current !== this.head);
        
        return newList;
    }

    reset() {
        this.head = null;
        this.tail = null;
        this.size = 0;
        this.render();
        showMessage('List reset 🔄', 'info');
    }

    render() {
        const visualizer = document.getElementById('visualizer');
        if(visualizer){
        visualizer.innerHTML = '';
        }
        
        if (!this.head) {
            visualizer.innerHTML = '<p class="empty-message">🔘 Empty list. Add nodes to visualize!</p>';
            document.getElementById('size').textContent = '0';
            document.getElementById('head').textContent = 'null';
            document.getElementById('tail').textContent = 'null';
            return;
        }
        
        let current = this.head;
        let nodes = [];
        do {
            nodes.push(current);
            current = current.next;
        } while (current !== this.head);
        
        nodes.forEach((node, i) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'node-wrapper';
            
            const circle = document.createElement('div');
            circle.className = 'node-circle';
            circle.style.background = `linear-gradient(135deg, ${this.getColor(i)}, ${this.getColor(i+1)})`;
            circle.dataset.value = node.value;
            
            const valSpan = document.createElement('span');
            valSpan.textContent = node.value;
            circle.appendChild(valSpan);
            
            const idxSpan = document.createElement('span');
            idxSpan.className = 'node-index';
            idxSpan.textContent = i;
            circle.appendChild(idxSpan);
            
            wrapper.appendChild(circle);
            
            const arrow = document.createElement('span');
            if (i === nodes.length - 1) {
                arrow.className = 'node-arrow circular';
                arrow.textContent = '↻';
                arrow.title = 'Circular link back to head';
            } else {
                arrow.className = 'node-arrow';
                arrow.textContent = '→';
            }
            wrapper.appendChild(arrow);
            
            visualizer.appendChild(wrapper);
        });
        
        document.getElementById('size').textContent = this.size;
        document.getElementById('head').textContent = this.head ? this.head.value : 'null';
        document.getElementById('tail').textContent = this.tail ? this.tail.value : 'null';
        document.getElementById('status').textContent = 'Ready';
    }
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================

let list = new CircularLinkedList();

function insertAtBeginning() {
    const value = document.getElementById('nodeValue').value.trim();
    if (!value) {
        showMessage('Please enter a value! ⚠️', 'error');
        return;
    }
    list.insertAtBeginning(value);
    document.getElementById('nodeValue').value = '';
}

function insertAtEnd() {
    const value = document.getElementById('nodeValue').value.trim();
    if (!value) {
        showMessage('Please enter a value! ⚠️', 'error');
        return;
    }
    list.insertAtEnd(value);
    document.getElementById('nodeValue').value = '';
}

function insertAtPosition() {
    const value = document.getElementById('nodeValue').value.trim();
    const position = parseInt(document.getElementById('position').value);
    
    if (!value) {
        showMessage('Please enter a value! ⚠️', 'error');
        return;
    }
    if (isNaN(position) || position < 0) {
        showMessage('Please enter a valid position! ⚠️', 'error');
        return;
    }
    
    list.insertAtPosition(value, position);
    document.getElementById('nodeValue').value = '';
    document.getElementById('position').value = '';
}

function deleteNode() {
    const value = document.getElementById('nodeValue').value.trim();
    if (!value) {
        showMessage('Please enter a value to delete! ⚠️', 'error');
        return;
    }
    list.deleteNode(value);
    document.getElementById('nodeValue').value = '';
}

function deleteAtPosition() {
    const position = parseInt(document.getElementById('position').value);
    if (isNaN(position) || position < 0) {
        showMessage('Please enter a valid position! ⚠️', 'error');
        return;
    }
    list.deleteAtPosition(position);
    document.getElementById('position').value = '';
}

function traverseCircular() {
    list.traverse();
}

function josephusDemo() {
    const step = parseInt(document.getElementById('stepValue').value) || 2;
    list.josephusDemo(step);
}

function resetList() {
    list.reset();
}

function addSampleData() {
    list.reset();
    [10, 20, 30, 40, 50].forEach(val => list.insertAtEnd(val));
    showMessage('Sample data loaded! 📊', 'success');
}

function highlightNode(node) {
    document.querySelectorAll('.node-circle').forEach(el => {
        el.classList.remove('highlight');
        if (el.dataset.value === String(node.value)) {
            el.classList.add('highlight');
        }
    });
}

function showMessage(text, type = 'info') {
    const msg = document.getElementById('message');
    if (!msg) return;
    msg.textContent = text;
    msg.className = `message ${type}`;
    msg.style.display = 'block';
    clearTimeout(msg._timeout);
    msg._timeout = setTimeout(() => {
        msg.style.display = 'none';
    }, 4000);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const active = document.activeElement;
        if (active && active.id === 'nodeValue') {
            insertAtEnd();
        }
    }
});


document.addEventListener('DOMContentLoaded', function() {
    list.render();
    showMessage('Welcome to Circular Linked List Simulator! 🎯', 'info');
}); Simulator! 🎯', 'info');
