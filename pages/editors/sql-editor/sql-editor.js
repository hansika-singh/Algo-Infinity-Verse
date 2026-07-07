document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  initSQLEditor();
});

function initLoadingScreen() {
  setTimeout(() => {
    const s = document.getElementById("loading-screen");
    if (s) s.classList.add("hidden");
  }, 1500);
}

function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", () => btn.classList.toggle("visible", window.scrollY > 400));
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  if (!menuToggle || !navLinks) return;
  let overlay = document.querySelector(".nav-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    document.body.appendChild(overlay);
  }
  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains("active");
    navLinks.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);
    overlay.classList.toggle("active", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
    const icon = menuToggle.querySelector("i");
    if (icon) { icon.classList.toggle("fa-bars", !isOpen); icon.classList.toggle("fa-times", isOpen); }
  };
  menuToggle.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  overlay.addEventListener("click", () => toggleMenu(false));
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));
  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;
  document.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
    const parent = toggle.closest(".has-dropdown");
    const menu = parent?.querySelector(".dropdown-menu");
    if (!parent || !menu) return;
    let t;
    parent.addEventListener("mouseenter", () => { if (!isMobile()) { clearTimeout(t); parent.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); } });
    parent.addEventListener("mouseleave", () => { if (!isMobile()) { t = setTimeout(() => { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }, 250); } });
    toggle.addEventListener("click", (e) => { if (isMobile()) { e.preventDefault(); e.stopPropagation(); const o = parent.classList.toggle("open"); toggle.setAttribute("aria-expanded", o); } });
  });
  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".navbar");
    if (nav) nav.style.background = window.scrollY > 100 ? "rgba(10,10,26,0.95)" : "rgba(10,10,26,0.85)";
  });
}

/* ─── Mock Database ─── */
let DB = {
  employees: [
    { id: 1, first_name: "John", last_name: "Doe", department: "Engineering", salary: 75000 },
    { id: 2, first_name: "Jane", last_name: "Smith", department: "Marketing", salary: 65000 },
    { id: 3, first_name: "Mike", last_name: "Johnson", department: "Engineering", salary: 80000 },
    { id: 4, first_name: "Sarah", last_name: "Williams", department: "HR", salary: 55000 },
    { id: 5, first_name: "Robert", last_name: "Brown", department: "Engineering", salary: 90000 }
  ]
};

/* ─── SQL Simulator ─── */
function simulateSQL(query) {
  query = query.trim();
  if (!query) return { error: "Empty query." };

  const queries = query.split(";").filter(q => q.trim());
  let lastResult = null;
  let messages = [];

  for (let q of queries) {
    q = q.trim();
    if (q.toUpperCase().startsWith("SELECT")) {
      lastResult = executeSelect(q);
      if (lastResult.error) return lastResult;
    } else if (q.toUpperCase().startsWith("INSERT")) {
      const res = executeInsert(q);
      if (res.error) return res;
      messages.push(res.message);
    } else if (q.toUpperCase().startsWith("UPDATE")) {
      const res = executeUpdate(q);
      if (res.error) return res;
      messages.push(res.message);
    } else if (q.toUpperCase().startsWith("DELETE")) {
      const res = executeDelete(q);
      if (res.error) return res;
      messages.push(res.message);
    } else if (q.toUpperCase().startsWith("CREATE")) {
      const res = executeCreate(q);
      if (res.error) return res;
      messages.push(res.message);
    } else {
      return { error: `Syntax error or unsupported statement: ${q.split(" ")[0]}` };
    }
  }

  return lastResult || { message: messages.join("\n") || "Query executed successfully." };
}

function executeSelect(q) {
  const selectMatch = q.match(
    /^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+GROUP\s+BY\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?\s*$/i
  );
  if (!selectMatch) return { error: "Invalid SELECT syntax." };

  let [, columns, tableName, where, groupBy, orderBy, limit] = selectMatch;
  where = where?.trim();
  groupBy = groupBy?.trim();
  orderBy = orderBy?.trim();
  tableName = tableName.toLowerCase();

  if (!DB[tableName]) return { error: `Table "${tableName}" not found.` };

  let data = [...DB[tableName]];

  // WHERE
  if (where) {
    try {
      // Basic WHERE implementation (e.g., department = 'Engineering')
      const whereParts = where.match(/(\w+)\s*(>=|<=|!=|=|>|<)\s*(.+)/);
      if (whereParts) {
        let [, col, op, val] = whereParts;
        val = val.trim().replace(/^'|'$/g, "");
        data = data.filter(row => {
          const rowVal = row[col];
          const compareVal = isNaN(val) ? val : Number(val);
          switch (op) {
            case "=": return rowVal == compareVal;
            case "!=": return rowVal != compareVal;
            case ">": return rowVal > compareVal;
            case "<": return rowVal < compareVal;
            case ">=": return rowVal >= compareVal;
            case "<=": return rowVal <= compareVal;
            default: return true;
          }
        });
      }
    } catch (e) { return { error: "Error parsing WHERE clause." }; }
  }

  // GROUP BY & Aggregates
  if (groupBy) {
    const groups = {};
    data.forEach(row => {
      const key = row[groupBy];
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    const result = [];
    for (let key in groups) {
      const row = {};
      row[groupBy] = key;
      columns.split(",").forEach(col => {
        col = col.trim();
        if (col.toUpperCase().startsWith("COUNT(")) row["COUNT(*)"] = groups[key].length;
        if (col.toUpperCase().startsWith("SUM(")) {
          const c = col.match(/\((.+)\)/)[1];
          row[`SUM(${c})`] = groups[key].reduce((a, b) => a + (b[c] || 0), 0);
        }
        if (col.toUpperCase().startsWith("AVG(")) {
          const c = col.match(/\((.+)\)/)[1];
          row[`AVG(${c})`] = groups[key].reduce((a, b) => a + (b[c] || 0), 0) / groups[key].length;
        }
      });
      result.push(row);
    }
    data = result;
  } else if (columns !== "*") {
    // Basic Column selection (not counting aggregates without group by)
    const cols = columns.split(",").map(c => c.trim());
    data = data.map(row => {
      const newRow = {};
      cols.forEach(c => newRow[c] = row[c]);
      return newRow;
    });
  }

  // ORDER BY
  if (orderBy) {
    const [col, dir] = orderBy.trim().split(/\s+/);
    const isDesc = dir && dir.toUpperCase() === "DESC";
    data.sort((a, b) => {
      if (a[col] < b[col]) return isDesc ? 1 : -1;
      if (a[col] > b[col]) return isDesc ? -1 : 1;
      return 0;
    });
  }

  // LIMIT
  if (limit) {
    data = data.slice(0, parseInt(limit));
  }

  return { columns: data.length > 0 ? Object.keys(data[0]) : [], rows: data };
}

function executeInsert(q) {
  const match = q.match(/INSERT\s+INTO\s+(\w+)\s*\((.+)\)\s*VALUES\s*\((.+)\)/i);
  if (!match) return { error: "Invalid INSERT syntax." };

  let [, tableName, cols, vals] = match;
  tableName = tableName.toLowerCase();
  if (!DB[tableName]) return { error: `Table "${tableName}" not found.` };

  const columns = cols.split(",").map(c => c.trim());
  const values = vals.split(",").map(v => v.trim().replace(/^'|'$/g, ""));

  const newRow = {};
  columns.forEach((col, i) => {
    newRow[col] = isNaN(values[i]) ? values[i] : Number(values[i]);
  });

  DB[tableName].push(newRow);
  return { message: `1 row inserted into ${tableName}.` };
}

function executeUpdate(q) {
  const match = q.match(/UPDATE\s+(\w+)\s+SET\s+(.+)\s+WHERE\s+(.+)/i);
  if (!match) return { error: "Invalid UPDATE syntax (WHERE clause required for simulation)." };

  let [, tableName, sets, where] = match;
  tableName = tableName.toLowerCase();
  if (!DB[tableName]) return { error: `Table "${tableName}" not found.` };

  const [whereCol, whereVal] = where.split("=").map(s => s.trim().replace(/^'|'$/g, ""));
  const setParts = sets.split(",").map(s => s.trim());

  let count = 0;
  DB[tableName].forEach(row => {
    if (row[whereCol] == whereVal) {
      setParts.forEach(part => {
        const [col, val] = part.split("=").map(s => s.trim().replace(/^'|'$/g, ""));
        row[col] = isNaN(val) ? val : Number(val);
      });
      count++;
    }
  });

  return { message: `${count} row(s) updated in ${tableName}.` };
}

function executeDelete(q) {
  const match = q.match(/DELETE\s+FROM\s+(\w+)\s+WHERE\s+(.+)/i);
  if (!match) return { error: "Invalid DELETE syntax (WHERE clause required for simulation)." };

  let [, tableName, where] = match;
  tableName = tableName.toLowerCase();
  if (!DB[tableName]) return { error: `Table "${tableName}" not found.` };

  const [whereCol, whereVal] = where.split("=").map(s => s.trim().replace(/^'|'$/g, ""));
  const initialCount = DB[tableName].length;
  DB[tableName] = DB[tableName].filter(row => row[whereCol] != whereVal);
  const deletedCount = initialCount - DB[tableName].length;

  return { message: `${deletedCount} row(s) deleted from ${tableName}.` };
}

function executeCreate(q) {
  const match = q.match(/CREATE\s+TABLE\s+(\w+)\s*\((.+)\)/i);
  if (!match) return { error: "Invalid CREATE TABLE syntax." };

  let [, tableName] = match;
  tableName = tableName.toLowerCase();
  if (DB[tableName]) return { error: `Table "${tableName}" already exists.` };

  DB[tableName] = [];
  return { message: `Table "${tableName}" created.` };
}

/* ─── Examples ─── */
const SQL_EXAMPLES = {
  select_all: `SELECT * FROM employees;`,
  where_clause: `SELECT * FROM employees 
WHERE department = 'Engineering' 
ORDER BY salary DESC;`,
  insert_row: `INSERT INTO employees (id, first_name, last_name, department, salary)
VALUES (6, 'Alice', 'Wonder', 'Design', 70000);
SELECT * FROM employees;`,
  update_row: `UPDATE employees SET salary = 85000 WHERE id = 1;
SELECT * FROM employees WHERE id = 1;`,
  delete_row: `DELETE FROM employees WHERE id = 4;
SELECT * FROM employees;`,
  group_by: `SELECT department, COUNT(*), AVG(salary) 
FROM employees 
GROUP BY department;`,
  create_table: `CREATE TABLE projects (id INT, name VARCHAR(50));
INSERT INTO projects (id, name) VALUES (1, 'Alpha');
SELECT * FROM projects;`
};

/* ─── Init Editor ─── */
function initSQLEditor() {
  const editor = document.getElementById("sqEditor");
  const outputBody = document.getElementById("sqOutputBody");
  const consoleBody = document.getElementById("sqConsoleBody");
  const runBtn = document.getElementById("sqRunBtn");
  const resetBtn = document.getElementById("sqResetBtn");
  const copyBtn = document.getElementById("sqCopyBtn");
  const saveBtn = document.getElementById("sqSaveBtn");
  const exampleSelect = document.getElementById("sqExampleSelect");
  const lineNumbers = document.getElementById("sqLineNumbers");
  const statusBadge = document.getElementById("sqStatusBadge");
  const consoleClear = document.getElementById("sqConsoleClear");
  const downloadBtn = document.getElementById("sqDownloadBtn");

  const SAVE_KEY = "sql-editor-draft";

  editor.value = localStorage.getItem(SAVE_KEY) || SQL_EXAMPLES.select_all;
  updateLines();

  exampleSelect.addEventListener("change", () => {
    editor.value = SQL_EXAMPLES[exampleSelect.value];
    updateLines();
  });

  runBtn.addEventListener("click", runCode);

  resetBtn.addEventListener("click", () => {
    editor.value = SQL_EXAMPLES[exampleSelect.value];
    updateLines();
  });

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(editor.value);
      copyBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i>'; }, 2000);
    } catch { logMessage("Could not copy to clipboard.", "error"); }
  });

  saveBtn.addEventListener("click", () => {
    localStorage.setItem(SAVE_KEY, editor.value);
    saveBtn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => { saveBtn.innerHTML = '<i class="fas fa-save"></i>'; }, 2000);
  });

  downloadBtn.addEventListener("click", () => {
    const blob = new Blob([editor.value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query.sql";
    a.click();
    URL.revokeObjectURL(url);
  });

  editor.addEventListener("input", updateLines);
  editor.addEventListener("scroll", () => { lineNumbers.scrollTop = editor.scrollTop; });

  editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = editor.selectionStart;
      editor.value = editor.value.substring(0, s) + "    " + editor.value.substring(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 4;
      updateLines();
    }
    if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); runCode(); }
  });

  consoleClear.addEventListener("click", () => {
    consoleBody.innerHTML = '<span class="sq-console-placeholder">No messages to display.</span>';
  });

  function runCode() {
    setStatus("running");
    outputBody.innerHTML = '<div class="sq-table-container"><span class="sq-output-placeholder">Executing query...</span></div>';
    
    setTimeout(() => {
      const result = simulateSQL(editor.value);

      if (result.error) {
        logMessage(result.error, "error");
        outputBody.innerHTML = '<div class="sq-table-container"><span class="sq-output-placeholder">Error executing query. Check console for details.</span></div>';
        setStatus("error");
      } else if (result.columns && result.rows) {
        renderTable(result.columns, result.rows);
        logMessage("Query executed successfully.");
        setStatus("ready");
      } else {
        outputBody.innerHTML = `<div class="sq-table-container"><span class="sq-output-placeholder">${result.message}</span></div>`;
        logMessage(result.message);
        setStatus("ready");
      }
    }, 300);
  }

  function renderTable(columns, rows) {
    if (rows.length === 0) {
      outputBody.innerHTML = '<div class="sq-table-container"><span class="sq-output-placeholder">Query returned 0 rows.</span></div>';
      return;
    }

    const table = document.createElement("table");
    table.className = "sq-result-table";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    columns.forEach(col => {
      const th = document.createElement("th");
      th.textContent = col;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach(row => {
      const tr = document.createElement("tr");
      columns.forEach(col => {
        const td = document.createElement("td");
        td.textContent = row[col] === null ? "NULL" : row[col];
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    outputBody.innerHTML = '';
    const container = document.createElement("div");
    container.className = "sq-table-container";
    container.appendChild(table);
    outputBody.appendChild(container);
  }

  function logMessage(msg, type = "info") {
    const placeholder = consoleBody.querySelector(".sq-console-placeholder");
    if (placeholder) placeholder.remove();
    const el = document.createElement("span");
    el.className = `sq-console-line ${type === "error" ? "error" : ""}`;
    el.textContent = msg;
    consoleBody.appendChild(el);
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }

  function setStatus(state) {
    const map = { ready: ["Ready", "sq-status-ready"], running: ["Running", "sq-status-running"], error: ["Error", "sq-status-error"] };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `sq-status-badge ${cls}`;
  }

  function updateLines() {
    const count = editor.value.split("\n").length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join("\n");
  }
}