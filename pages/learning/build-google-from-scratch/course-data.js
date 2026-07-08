const courseData = {
    title: "Build Google From Scratch: Masterclass",
    modules: [
        {
            id: "m1",
            title: "Module 1: Distributed Systems & Consensus",
            description: "Understand the fundamental laws of physics in distributed computing. Without these, you cannot build systems at planetary scale.",
            locked: false, // First module is always unlocked
            items: [
                {
                    id: "m1-l1",
                    type: "reading",
                    title: "The CAP Theorem and PACELC",
                    content: `
                        <h2>The Reality of Distributed Systems</h2>
                        <p>At Google scale, failure is not an anomaly; it is the statistical norm. When you have 100,000 servers, you will experience hard drive crashes, power losses, and network switches dying <em>every single day</em>. Because of this, software must be designed with the assumption that hardware will fail.</p>
                        
                        <h3>The CAP Theorem</h3>
                        <p>Proposed by Eric Brewer in 2000, the CAP theorem states that a distributed data store can only simultaneously provide more than two out of the following three guarantees:</p>
                        <ul>
                            <li><strong>Consistency:</strong> Every read receives the most recent write or an error.</li>
                            <li><strong>Availability:</strong> Every request receives a (non-error) response, without the guarantee that it contains the most recent write.</li>
                            <li><strong>Partition Tolerance:</strong> The system continues to operate despite an arbitrary number of messages being dropped (or delayed) by the network between nodes.</li>
                        </ul>
                        <p>Because network partitions (P) are a given in the real world, you must choose between Consistency (CP) and Availability (AP). Google's core databases like Spanner and Bigtable strongly favor CP architectures, but they engineer the network to make partitions incredibly rare.</p>

                        <h3>The PACELC Extension</h3>
                        <p>CAP only applies when there is a partition. What happens during normal operation? PACELC states: <em>If there is a Partition (P), how does the system trade off Availability and Consistency (A and C); Else (E), when the system is running normally in the absence of partitions, how does the system trade off Latency (L) and Consistency (C)?</em></p>
                        <p>For example, DynamoDB is PA/EL (favors availability during partition, latency during normal operation). Spanner is PC/EC (favors consistency during partition, consistency during normal operation).</p>
                    `
                },
                {
                    id: "m1-l2",
                    type: "reading",
                    title: "Consistent Hashing & The Ring",
                    content: `
                        <h2>Scaling Caches to Thousands of Nodes</h2>
                        <p>When Google serves search results, it relies on massive distributed caches. The naive way to route a request to a cache server is using modulo arithmetic: <code>server_index = hash(key) % N</code> where N is the number of servers.</p>
                        <p><strong>The Catastrophe:</strong> If one server goes down, N becomes N-1. Suddenly, <code>hash(key) % (N-1)</code> routes almost every single key to a <em>different</em> server. The entire cache is invalidated. This causes a "thundering herd" problem that will instantly crash the backend database.</p>
                        
                        <h3>The Solution: Consistent Hashing</h3>
                        <p>Consistent hashing solves this by mapping both the servers and the data keys onto a conceptual circle (or hash ring). You hash the server's IP to place it on the ring. You hash the data key to place it on the ring. To find which server holds the data, you start at the key's position and move clockwise until you find a server.</p>
                        <p>When a server dies, only the keys that mapped specifically to it are reassigned to the next clockwise server. All other keys remain intact. This means only <code>1/N</code> keys are remapped, avoiding the catastrophic cache miss storm.</p>
                    `
                },
                {
                    id: "m1-lab1",
                    type: "lab",
                    title: "Interactive Lab: Consistent Hashing",
                    content: "Use the simulator to add and remove nodes on the hash ring. Observe how the data keys (yellow) are reassigned to the servers (blue) without completely invalidating all connections.",
                    labId: "consistent-hashing-lab"
                },
                {
                    id: "m1-quiz",
                    type: "quiz",
                    title: "Module 1 Evaluation",
                    passingScore: 100, // percentage
                    questions: [
                        {
                            q: "According to PACELC, if a system is PA/EL, what does it prioritize during normal operation (no partition)?",
                            options: [
                                { text: "Consistency", isCorrect: false },
                                { text: "Latency", isCorrect: true },
                                { text: "Availability", isCorrect: false }
                            ]
                        },
                        {
                            q: "In Consistent Hashing, if a cluster has 100 servers and 1 server crashes, approximately what percentage of keys will be remapped?",
                            options: [
                                { text: "99%", isCorrect: false },
                                { text: "100%", isCorrect: false },
                                { text: "1%", isCorrect: true }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            id: "m2",
            title: "Module 2: Google's Global Infrastructure",
            description: "Deep dive into GFS, Colossus, Bigtable, and Spanner. How Google stores Exabytes of data.",
            locked: true,
            items: [
                {
                    id: "m2-l1",
                    type: "reading",
                    title: "GFS & Bigtable Architecture",
                    content: `
                        <h2>Google File System (GFS)</h2>
                        <p>Google needed to store petabytes of data using cheap commodity hardware that failed frequently. They created GFS (now evolved into Colossus). GFS divides files into massive 64MB chunks. A single "Master" node holds the metadata (where chunks live), while thousands of "Chunkservers" hold the actual data, replicated 3x across different racks.</p>
                        
                        <h2>Bigtable: The Sparse, Multi-dimensional Map</h2>
                        <p>Bigtable sits on top of GFS. It is not a relational database. It is a sparse, distributed, persistent multi-dimensional sorted map. It's indexed by a row key, column key, and a timestamp.</p>
                        <p><strong>LSM Trees:</strong> Bigtable uses Log-Structured Merge-Trees. Writes are extremely fast because they are appended to an in-memory <code>MemTable</code> and a commit log. When the MemTable gets full, it flushes to disk as an immutable <code>SSTable</code> (Sorted String Table). Because SSTables are immutable, reads can access them without locking.</p>
                        <p><strong>Bloom Filters:</strong> To prevent reading every SSTable on disk to find a missing key, Bigtable keeps a Bloom Filter in memory. A Bloom filter is a probabilistic data structure that can tell you with 100% certainty if a key is <em>not</em> in a file, saving expensive disk seeks.</p>
                    `
                },
                {
                    id: "m2-l2",
                    type: "reading",
                    title: "Spanner and TrueTime",
                    content: `
                        <h2>The Problem with Global Clocks</h2>
                        <p>If Server A in New York writes data, and Server B in Tokyo writes data 1 millisecond later, how do you guarantee which write happened first? NTP (Network Time Protocol) can drift by tens of milliseconds. If the clocks drift, you might commit transactions in the wrong order.</p>

                        <h2>The TrueTime API</h2>
                        <p>Google solved this physics problem by installing GPS receivers and atomic clocks in every data center. This creates the <strong>TrueTime API</strong>, which returns a time interval <code>[earliest, latest]</code> representing the maximum possible clock uncertainty (usually under 4ms).</p>
                        <p><strong>The Spanner Commit Rule:</strong> When Spanner commits a transaction, it waits until the current time is strictly greater than the <code>latest</code> bound of the transaction timestamp. By simply waiting out the uncertainty window, Spanner guarantees external consistency across the globe. It is a marvel of distributed systems engineering.</p>
                    `
                },
                {
                    id: "m2-quiz",
                    type: "quiz",
                    title: "Module 2 Evaluation",
                    passingScore: 100,
                    questions: [
                        {
                            q: "Why are writes in Bigtable (LSM Trees) so fast?",
                            options: [
                                { text: "Because it overwrites data in-place on the hard drive.", isCorrect: false },
                                { text: "Because it only writes to an in-memory MemTable and appends to a log, avoiding random disk seeks.", isCorrect: true },
                                { text: "Because it doesn't replicate data.", isCorrect: false }
                            ]
                        },
                        {
                            q: "How does Spanner guarantee external consistency across global datacenters?",
                            options: [
                                { text: "By using a single global master node in California.", isCorrect: false },
                                { text: "By using the TrueTime API and waiting out the clock uncertainty window before committing.", isCorrect: true },
                                { text: "By using NTP to perfectly sync all clocks to the microsecond.", isCorrect: false }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            id: "m3",
            title: "Module 3: Search Engine & MapReduce",
            description: "How to process petabytes of crawled data and rank billions of web pages in milliseconds.",
            locked: true,
            items: [
                {
                    id: "m3-l1",
                    type: "reading",
                    title: "Inverted Indexing & MapReduce",
                    content: `
                        <h2>The Inverted Index</h2>
                        <p>You cannot search billions of documents by reading them one by one. Search engines use an Inverted Index. Instead of mapping a Document ID to a list of words, it maps a Word to a list of Document IDs (and their positions). <code>"google" -> [Doc1:pos5, Doc7:pos12]</code>.</p>
                        
                        <h2>MapReduce: Processing at Scale</h2>
                        <p>Building that index from billions of raw HTML files requires distributed computing. Google invented MapReduce to simplify this.</p>
                        <ul>
                            <li><strong>Map Phase:</strong> Workers read chunks of web pages. For every word, they output an intermediate key/value pair. E.g., <code>Map(Doc1) -> emit("google", Doc1), emit("search", Doc1)</code>.</li>
                            <li><strong>Shuffle/Sort:</strong> The system groups all values by the same key and routes them to the same reducer.</li>
                            <li><strong>Reduce Phase:</strong> The reducer takes a key and a list of values, and outputs the final result. E.g., <code>Reduce("google", [Doc1, Doc7]) -> "google": [Doc1, Doc7]</code>.</li>
                        </ul>
                    `
                },
                {
                    id: "m3-lab1",
                    type: "lab",
                    title: "Interactive Lab: MapReduce Simulator",
                    content: "Simulate a MapReduce job to generate an inverted index from raw documents.",
                    labId: "mapreduce-lab"
                },
                {
                    id: "m3-quiz",
                    type: "quiz",
                    title: "Module 3 Evaluation",
                    passingScore: 100,
                    questions: [
                        {
                            q: "In MapReduce, what is the primary purpose of the Shuffle phase?",
                            options: [
                                { text: "To encrypt the data before saving it to disk.", isCorrect: false },
                                { text: "To group all intermediate values associated with the same key so they go to the same Reducer.", isCorrect: true },
                                { text: "To randomly distribute data for load balancing.", isCorrect: false }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

// If running in browser, attach to window. If in node, export it.
if (typeof window !== 'undefined') {
    window.courseData = courseData;
} else {
    module.exports = courseData;
}
