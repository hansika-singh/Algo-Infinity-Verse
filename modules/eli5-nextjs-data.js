/**
 * ELI5 (Explain Like I'm 5) content for Next.js Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5NextjsData = {
  'ar-1': `
    <p>The Next.js App Router is like a <strong>filing system for a big office building</strong>.</p>
    <p>Each folder on your computer represents a room (a page) in the building. When you create a <code>page.tsx</code> file inside a folder, that's like putting a sign on a room door saying "This is the About page!" or "This is the Dashboard page!"</p>
    <p>A <code>layout.tsx</code> file is like the <strong>hallway</strong> that wraps around multiple rooms — it provides the same paint color, lighting, and decorations for every room inside it. If you change the hallway, all rooms get the new look!</p>
    <p>This file-based routing means you don't write route code — the <strong>folder structure IS your website structure</strong>. No configuration needed!</p>
  `,
  'sc-1': `
    <p>Imagine a <strong>restaurant</strong>:</p>
    <ul>
      <li><strong>Server Components</strong> are the <strong>kitchen</strong>. Chefs (the server) do all the heavy cooking — chopping vegetables (fetching data from a database), boiling pasta (reading files), and grilling meat (running complex logic). Then they send you the <strong>finished dish</strong> (ready HTML). You never see the raw ingredients or the cooking process.</li>
      <li><strong>Client Components</strong> are the <strong>dining table</strong>. This is where you interact with the food — add salt, ketchup, cut the steak. In web terms: clicking buttons, typing text, scrolling, hovering over things.</li>
    </ul>
    <p>Adding <code>"use client"</code> at the top of a file is like moving the recipe from the kitchen to the table. Now interactive things (like <code>useState</code> for counters or <code>onClick</code> for buttons) can work!</p>
    <p><strong>Why this matters:</strong> Server Components send less JavaScript to the browser, so pages load faster — especially on slow phones!</p>
  `,
  'df-1': `
    <p><strong>Server Actions</strong> are like dropping a letter in a <strong>mailbox</strong>.</p>
    <p>You write what you want to do on a piece of paper ("Save this post title to the database!"), fold it into an envelope (the form data), and drop it in the mailbox (submit the form).</p>
    <p>The mail carrier (the server) picks up the letter, reads it, and does the task. You don't need to know how mail sorting works, which truck carries it, or how it gets to the destination — the server handles all of that automatically!</p>
    <p>In Next.js, the <code>"use server"</code> directive marks a function as a Server Action. This means:</p>
    <ul>
      <li>The form works even if JavaScript is disabled (progressive enhancement).</li>
      <li>The data never leaves the server until the response is ready.</li>
      <li>No need to build API endpoints for simple form submissions!</li>
    </ul>
  `,
};

/* Expose globally for script-tag usage */
window.eli5NextjsData = eli5NextjsData;
