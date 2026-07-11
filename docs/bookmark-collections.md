# Smart Bookmark Collections

Bookmark collections extend the existing favorites flow in Algo Infinity Verse without replacing it.

## What is included
- Create unlimited collections with name, description, optional icon, and color
- Add a problem to one or more collections while keeping favorites intact
- Remove a problem from one or more collections without deleting the favorite record until all collections are cleared
- Rename and delete collections without removing the underlying favorite problems
- Preview collection summaries on the dashboard and profile pages

## Storage
- Guest users persist collections through the existing localStorage-backed user progress store
- Authenticated users continue to use the same progress persistence pipeline

## Usage
1. Open the Practice Problems page.
2. Create a collection using the form near the top of the section.
3. Use the collection picker under each problem card to assign the problem to one or more collections.
4. Review collection health and counts from the dashboard/profile widgets.
