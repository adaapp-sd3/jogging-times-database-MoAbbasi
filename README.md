# Jogging Times App

You've been hired to implement the backend and database for a new app that
allows joggers to track their runs. A front-end developer has already created
the UI for the app, but right now it's populated with dummy data - fake,
hard-coded information to make it look right.

There's also code for a basic (and quite insecure!) user login system.

Your task is to implement the backend and database to allow the app to meet the
following requirements:

- Users can create accounts with a name, email address, and password
- User passwords are stored securely according to best practise
- Users can log into their account
- Logged in users can log out of their account
- The main page of the app shows:
  - A set of statistics - total distance, total duration, and average speed
    across all jogs
  - A 'add new jogging time' button
  - A list of every previous jogging time
- Clicking on the 'add new jogging time' button takes the user to a form where
  they can create jogging times
- Clicking on an existing jogging time takes the user to a form where they can
  edit or delete the time
- Improve the general app security through e.g. form validations, revising the
  login system, etc.

Additional requirements (the UI for these has not been created yet):

- Users can delete thier accounts
- Users can follow other users
- Users can see a list of the users they follow
- Users can see a list of thier followers
- Users can see a timeline of jog times from people they follow
- Users can see a ranking of them compared to they follow - who has the fastest
  speed, most distance, etc.

## Getting Started

To get started, fork the repo in GitHub. Then, clone it to your own computer.
Run `npm install` to get all the dependencies set up. Run `npm start` to start
the app.

> **Note:** running `npm start` will make the app automatically restart when you
> make changes - no need to constantly stop and restart the server

At first, the app probably won't run. You need to edit database.sqlite to add a
`user` table.

## Important SQLite thing!!!

When creating an auto-incrementing primary key, the syntax has to be:

```sql
CREATE TABLE my_table (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ...
);
```

Note we user `INTEGER` instead of `INT` and `AUTOINCREMENT` instead of
`AUTO_INCREMENT`.

If you don't do this, your ids won't work properly.

## Guide to existing code

### Key Files

- `models/User.js` - the User model class. Contains several static methods for
  inserting and querying users from the database
- `public/` - any files you put in here will get served publicly
  - `public/tailwind.css` - a CSS framework used to style the app. See
    https://tailwindcss.com/ for more information.
- `views/` - a set of HTML pages for each part of our app. These use
  [Handlebars](https://handlebarsjs.com/) to include our data in our HTML pages
  - `views/create-account.html` - the template for the create account form
  - `views/create-time.html` - the template for the create new jogging time form
  - `views/edit-time.html` - the template for the edit jogging time form
  - `views/list-times.html` - the template for the main page of the app, which
    lists all jogging times
  - `views/sing-in.html` - the template for the sign-in form
- `database.js` - sets up the database. This uses
  [sql.js](https://github.com/kripken/sql.js)
- `database.sqlite` - the database + some helper functions to make working with
  it easier
- `routes.js` - what to do for each route (method and URL) in the app
- `server.js` - sets everything up and starts the app

To implement all of the initial requirements, the only files you should need to
touch are:

- `models/` - this is where all our database interaction happens
- `routes.js` - the brains of our app - what each page and form does
- `database.sqlite` - you need to create the correct tables in here

### Interacting with the database

Whenever we need to interact with the database, we need to:

1. (at the top of your file) load `database.js`
2. Execute your SQL statements
3. Do something with the results

Example:

```js
// load database.js
var { db, helpers } = require('../path/to/database.js')

// in each of the below examples, each item in an array replaces a ?.
// this ? syntax lets us avoid SQL injections.

// run a sql query, returning one row
var row = helpers.getRow('SELECT * FROM pets WHERE id = ?', [10])

// run a sql query, returning an array of all the rows
var rows = helpers.getRows('SELECT * FROM pets WHERE name = ?', ['rufus'])

// insert a row and get the id we inserted
var insertedId = helpers.insert('INSERT INTO pets (name) VALUES (?)', ['rufus'])
```

### Final note

There's a lot of code here! Some of it is using libraries you've never
encountered before, so you may need to do some research. If you get stuck,
remember to ask a colleague or coach!
