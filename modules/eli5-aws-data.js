/**
 * ELI5 (Explain Like I'm 5) content for AWS Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5AwsData = {
  'm1-l1': `
    <p><strong>IAM</strong> (Identity and Access Management) is like a <strong>school ID card system</strong>.</p>
    <ul>
      <li><strong>Users</strong> are <strong>students</strong> — each person gets their own ID card with their photo.</li>
      <li><strong>Groups</strong> are like <strong>classes</strong>. All students in the Science Club get the same permissions: "Can enter the Science Lab." All students in the Art Club: "Can enter the Art Studio."</li>
      <li><strong>Roles</strong> are like <strong>visitor badges</strong> at the front desk. A parent visiting gets a temporary badge that says "Visitor — can enter the main office but not classrooms." The badge expires at the end of the day.</li>
      <li><strong>Policies</strong> are the <strong>rulebook</strong>: "Alice can enter Room 201, Bob can only enter the Library, nobody can enter the Staff Lounge."</li>
    </ul>
    <p>The most important idea: an <strong>EC2 instance</strong> (a virtual computer) gets a <strong>Role</strong>, not a User. It's like giving the school robot a temporary badge to fetch attendance records from the office — it doesn't need its own student ID!</p>
  `,
  'm2-l1': `
    <p>A <strong>VPC</strong> (Virtual Private Cloud) is like building your own <strong>private, fenced-in neighborhood</strong>.</p>
    <p>You decide:</p>
    <ul>
      <li>Where the houses (EC2 servers) go.</li>
      <li>Which streets (subnets) connect them.</li>
      <li>Who gets to come through the gate (security groups / firewalls).</li>
      <li>Whether the neighborhood has a public park (accessible from the internet) or is completely gated (private only).</li>
    </ul>
    <p>It's your own little virtual city inside AWS — completely isolated from everyone else's city unless you build a bridge (VPC Peering).</p>
  `,
  'm2-l2': `
    <p><strong>EC2</strong> (Elastic Compute Cloud) is like <strong>renting an apartment</strong> in that neighborhood you just built (the VPC).</p>
    <ul>
      <li>You choose the <strong>size</strong> (t3.micro = studio apartment, m5.large = two-bedroom, x1e.32xlarge = mansion).</li>
      <li>You pick the <strong>operating system</strong> (Windows apartment or Linux apartment).</li>
      <li>You move your <strong>furniture</strong> in (install software).</li>
      <li>You pay <strong>rent by the hour</strong> (or by the second).</li>
    </ul>
    <p>The magical part: if you need more apartments because your business is growing, you can start 100 more in minutes. And when you're done, you move out and <strong>stop paying</strong>. No long-term lease!</p>
  `,
  'm3-l1': `
    <p><strong>S3</strong> (Simple Storage Service) is like a <strong>giant, magical warehouse</strong> where you can store unlimited boxes.</p>
    <ul>
      <li>Each box has a <strong>label</strong> (the object key, like "photos/vacation/beach.jpg").</li>
      <li>You put <strong>anything</strong> in the boxes — photos, videos, documents, website files.</li>
      <li>The warehouse <strong>never runs out of space</strong> (11+ trillion objects stored by real companies).</li>
      <li>The warehouse <strong>automatically makes copies</strong> of your boxes in different cities (99.999999999% durability — that's 11 nines!).</li>
      <li>You can access any box from anywhere in the world — just tell the warehouse the label.</li>
    </ul>
    <p>Think of S3 as a magic backpack: you put things in, they never get lost, you can access them from any computer, and the backpack is infinitely big!</p>
  `,
  'm3-l2': `
    <p><strong>RDS</strong> (Relational Database Service) is like <strong>hiring a team of robot librarians</strong>.</p>
    <p>You tell the robots: "I need a database for my library." They handle everything:</p>
    <ul>
      <li>They set up the <strong>bookshelves</strong> (create the database server).</li>
      <li>They <strong>organize the books alphabetically</strong> (set up the schema).</li>
      <li>They make <strong>backup copies</strong> of all the books every night (automated backups).</li>
      <li>If a bookshelf breaks, they <strong>fix it automatically</strong> (auto-recovery).</li>
      <li>If more people come to the library, they add more <strong>reading tables</strong> (auto-scaling).</li>
    </ul>
    <p>Without RDS, you'd be the librarian yourself: building shelves, fixing broken ones, making copies by hand, staying up late to clean. With RDS, the robots do all the hard work — you just bring the books!</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5AwsData = eli5AwsData;
