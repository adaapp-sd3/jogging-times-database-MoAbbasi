var fs = require('fs')
var SQL = require('sql.js')

// open a database
var databaseFileBuffer = fs.readFileSync('./database.sqlite')
var db = new SQL.Database(databaseFileBuffer)

// sql.js won't save the database file. this is a hack to overwrite it every second.
// if it's changed. in a normal database system this isn't needed.
setInterval(() => {
  var bytes = db.export()
  var newDatabaseFileBuffer = Buffer.from(bytes)
  if (!newDatabaseFileBuffer.equals(databaseFileBuffer)) {
    console.log(
      `Saving database (${(newDatabaseFileBuffer.length / 1024).toFixed(1)}kb)`
    )
    fs.writeFileSync('./database.sqlite', newDatabaseFileBuffer)
    databaseFileBuffer = newDatabaseFileBuffer
  }
}, 500)

var helpers = {
  // run a query returning any number of rows
  getRows(sqlString, bindings) {
    var statement = db.prepare(sqlString)
    var rows = []
    statement.bind(bindings)
    while (statement.step()) {
      rows.push(statement.getAsObject())
    }
    statement.free()
    return rows
  },
  // run a query returning a single row, or null if no rows returned
  getRow(sqlString, bindings) {
    var rows = helpers.getRows(sqlString, bindings)
    if (rows.length === 0) {
      return null
    }
    if (rows.length !== 1) {
      throw new Error(
        `Expected getRow to return a single row, got ${rows.length}`
      )
    }
    return rows[0]
  },
  // run a query that shouldn't return any rows
  runAndExpectNoRows(sqlString, bindings) {
    var rows = helpers.getRows(sqlString, bindings)
    if (rows.length !== 0) {
      throw new Error(`Expected no rows, but got ${rows.length}`)
    }
  },
  // insert a row and return its id
  insertRow(sqlString, bindings) {
    helpers.runAndExpectNoRows(sqlString, bindings)
    return helpers.getRow('select last_insert_rowid() as id').id
  }
}

// export the database so we can use it elsewhere
module.exports = {
  db,
  helpers
}
