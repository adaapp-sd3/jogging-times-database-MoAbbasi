var express = require('express')
var morgan = require('morgan')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var mustacheExpress = require('mustache-express')
var expressHandlebars = require('express-handlebars')
var routes = require('./routes')

// the port to listen on. choose whatever you want!
var port = process.env.PORT || 3000
// secret used for signing cookies
var secret = process.env.COOKIE_SECRET || "very secret string"

// create a new express app:
var app = express()

// set up logging on our app:
app.use(morgan('dev'))

// turn JSON in requests to something we can work with:
app.use(bodyParser.json())

// let us set and retrieve cookies for user auth:
app.use(cookieParser(secret))

// turn forms in requests to something we can work with:
app.use(bodyParser.urlencoded({ extended: true }))

// serve everything in the public directory:
app.use(express.static('public'))

// use the mustache for rendering views:
app.engine('html', expressHandlebars())
app.set('view engine', 'handlebars')

// create all the routes
app.use(routes)

// start the app!
app.listen(port, function() {
  console.log('Server listening on http://localhost:' + port)
})
