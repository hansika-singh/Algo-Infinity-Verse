document.addEventListener('DOMContentLoaded', () => {
    const btnExecute = document.getElementById('btn-execute');
    const btnReset = document.getElementById('btn-reset');
    const dataloaderToggle = document.getElementById('dataloader-toggle');
    
    const astContainer = document.getElementById('ast-container');
    const dbQueriesList = document.getElementById('db-queries-list');
    
    const statQueries = document.getElementById('stat-queries');
    const statTime = document.getElementById('stat-time');

    let queryCount = 0;
    let timeSimulated = 0;
    let isExecuting = false;

    const mockUsers = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'David' },
        { id: 5, name: 'Eve' }
    ];

    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function createAstNode(text, parentElement) {
        const node = document.createElement('div');
        node.className = 'ast-node';
        node.textContent = text;
        parentElement.appendChild(node);
        return node;
    }

    function createAstRow(parentElement) {
        const row = document.createElement('div');
        row.className = 'ast-row';
        parentElement.appendChild(row);
        return row;
    }

    function logDbQuery(queryText, isBatched = false) {
        const queryEl = document.createElement('div');
        queryEl.className = `db-query ${isBatched ? 'batched' : ''}`;
        queryEl.textContent = queryText;
        dbQueriesList.appendChild(queryEl);
        dbQueriesList.scrollTop = dbQueriesList.scrollHeight;
        
        queryCount++;
        statQueries.textContent = queryCount;
    }

    function setResolving(node) {
        node.classList.add('resolving');
    }

    function setResolved(node) {
        node.classList.remove('resolving');
        node.classList.add('resolved');
    }

    async function executeNaive() {
        // Root User Query
        const rootRow = createAstRow(astContainer);
        const userQueryNode = createAstNode('Query: users(limit: 5)', rootRow);
        
        setResolving(userQueryNode);
        await sleep(500);
        logDbQuery('SELECT * FROM users LIMIT 5;');
        timeSimulated += 50;
        statTime.textContent = timeSimulated + 'ms';
        await sleep(500);
        setResolved(userQueryNode);

        // Child Post Queries (The N in N+1)
        const postsRow = createAstRow(astContainer);
        
        for (const user of mockUsers) {
            const userNode = createAstNode(`User ${user.id} resolving 'posts'`, postsRow);
            setResolving(userNode);
            await sleep(400); // Network delay
            logDbQuery(`SELECT * FROM posts WHERE user_id = ${user.id};`);
            timeSimulated += 50;
            statTime.textContent = timeSimulated + 'ms';
            setResolved(userNode);
            await sleep(200);
        }
    }

    async function executeDataLoader() {
        // Root User Query
        const rootRow = createAstRow(astContainer);
        const userQueryNode = createAstNode('Query: users(limit: 5)', rootRow);
        
        setResolving(userQueryNode);
        await sleep(500);
        logDbQuery('SELECT * FROM users LIMIT 5;');
        timeSimulated += 50;
        statTime.textContent = timeSimulated + 'ms';
        await sleep(500);
        setResolved(userQueryNode);

        // Child Post Queries batched by DataLoader
        const postsRow = createAstRow(astContainer);
        const userNodes = [];
        
        // Simulating the DataLoader tick (event loop tick collects all keys)
        for (const user of mockUsers) {
            const userNode = createAstNode(`User ${user.id} queue 'posts'`, postsRow);
            setResolving(userNode);
            userNodes.push(userNode);
            await sleep(100);
        }

        await sleep(500);
        
        // Single Batched Query
        const userIds = mockUsers.map(u => u.id).join(', ');
        logDbQuery(`SELECT * FROM posts WHERE user_id IN (${userIds});`, true);
        timeSimulated += 80; // slightly longer single query, but way faster than N queries
        statTime.textContent = timeSimulated + 'ms';
        
        await sleep(500);
        
        userNodes.forEach(node => setResolved(node));
    }

    async function runSimulation() {
        if (isExecuting) return;
        isExecuting = true;
        btnExecute.disabled = true;
        
        // Reset state
        astContainer.innerHTML = '';
        dbQueriesList.innerHTML = '';
        queryCount = 0;
        timeSimulated = 0;
        statQueries.textContent = '0';
        statTime.textContent = '0ms';

        if (dataloaderToggle.checked) {
            await executeDataLoader();
        } else {
            await executeNaive();
        }

        isExecuting = false;
        btnExecute.disabled = false;
    }

    btnExecute.addEventListener('click', runSimulation);

    btnReset.addEventListener('click', () => {
        if (isExecuting) return;
        astContainer.innerHTML = '';
        dbQueriesList.innerHTML = '';
        queryCount = 0;
        timeSimulated = 0;
        statQueries.textContent = '0';
        statTime.textContent = '0ms';
    });
});
