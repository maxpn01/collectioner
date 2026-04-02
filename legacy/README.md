# Collectioner

> A simple collection management software built as a course project. 

### tech and principles used
---

- **frontend stack:** vite, react, tailwindcss.
- **ui library:** shadcn
- **markdown editor:** mdx editor
- **backend stack:** express, postgresql, prisma
- **testing:** vitest, ts-mockito
- **encryption:** bcrypt.js
- **authentication:** express-session
- **search engine:** meilisearch
- **architecture:** clean architecture

### requirements
---

#### authentication / authorization
- [x] users can register and authenticate via forms.
- [x] non-authenticated users have read-only access.
    - [x] can search and view non-admin pages.
    - [x] can’t create and modify collections, items, leave comments.
- [x] authenticated non-admins have access to everything except admin-page.
- [x] admin-page allows user management.
    - [x] view, block, unblock, delete.
    - [x] grant admin privileges, revoke admin privileges.
    - [x] admin is able to remove admin access from itself.
- [x] admin sees all pages as their author.
    - [x] can open any collection of any user and modify items.

#### main page
- [ ] list of latest items (name, collections, authors).
- [ ] list of top 5 largest collections.
- [ ] tag cloud (when the user clicks on the tag display the list of items — in general use “search results page” for it).

#### pages
- [x] every page provides an access to the full-text search (in the top header). search results are always items.
    - [x] if text is found in the comment, search result has to display a link to the item with comments,
    - [x] if result is a collection you can either display any item or generate link to the collection.
- [x] every user has its personal page where they can manage a list of collections (create, delete, edit).
    - [x] each collection in the list is a link to the collection page that contains table of items with sorting/filtering and capabilities to create new item, edit or delete existing item.

#### collections
- [ ] every collection contains:
    - [x] name,
    - [x] description (with markdown formatting support),
    - [x] topic (one value from the predefined list, for example, “books”),
    - [ ] optional image (uploaded by the users into the cloud).
    - [x]  number of items
- [x] collection allows to specify fields of every item in the collection.
    - [x] there are fixed fields — id, name, tags.
    - [x] on the collection level user can select several of the following — 3 integer fields, 3 string fields, 3 multiline text fields, 3 boolean checkboxes, 3 date fields.
    - [x] for all selected custom fields user specifies its name. 
    - [x] all fields should be rendered on the item page, and some on the collection page in the list of items (eg strings and dates).

#### items
- [x] all items have tags.
    - [x] user can enter several tags.
    - [ ] it’s necessary to support autocompletion — when user starts entering text, you have to display dropdown with tags starting with entered letter already stored in database.
- [x] when item is opened for view there is a comments section at the bottom.
    - [x] comments are linear (it’s impossible to insert a comment before another comment).
    - [ ] comments have to be updated automatically with a small delay.
- [ ] every item can also have likes (no more than one from a user per given item).

#### languages and visual themes
- [ ] site should support two languages: english and any other (the choice is saved).
- [ ] site should support two visual themes: light and dark (the choice is saved).

#### misc
- [x] support different screen resolutions; adaptiveness.
- [x] use ORM to access data.
- [x] use full-text search engine (either external library or using native database features) — user can’t perform full database scan with selects.

#### optional
- [ ] authentication via social networks.
- [ ] add custom fields with the type “one from the given list” with ability to specify list of available options.
- [x] add any number of custom fields of any kind.
- [ ] add export collections to csv-file.


### additional todos
---

- [ ] comment likes
- [ ] collection tags
- [ ] item images
- [ ] user settings
- [ ] rate limiter
- [ ] compression gzip