var express	= require('express');
var bcrypt	= require('bcryptjs');

var User	= require('./models/User');
var Token	= require('./models/Token');
var Session	= require('./models/Session');
var Form	= require('./models/Form');

var createAccountForm	= new Form({ name: "string", email: "email", password: "password", passwordConfirm: "password" });
var signInForm			= new Form({ email: "email", password: "password" });
var sessionForm			= new Form({ startTime: "string", duration: "positive number", distance: "positive number" });

var routes = new express.Router();

var saltRounds = 10;

// main page
routes.get('/', function(req, res) {
	Token.auth(req, res, (req, res) => { res.redirect('/times'); });
});

// show the create account page
routes.get('/create-account', function(req, res) {
	res.render('create-account.html');
});

// handle create account forms:
routes.post('/create-account', function(req, res) {
	createAccountForm.validate(req, res, 'create-account.html', {}, (req, res, form) => {
		if (User.findById(form.name)) {
			res.render('sign-in.html', {
				errorMessage: 'Username has already been taken'
			});
		} else if (User.findByEmail(form.email)) {
			res.render('sign-in.html', {
				errorMessage: 'Email already in use'
			});
		} else {
			// hash the password - we dont want to store it directly
			var passwordHash = bcrypt.hashSync(form.password, saltRounds);
			
			// create the user
			var userId = User.insert(form.name, form.email, passwordHash);
			
			// set the userId as a cookie
			res.cookie('userId', userId, { signed: true });
			// and create a token for the user
			res.cookie('token', Token.generateToken(userId), { signed: true });
			
			// redirect to the logged in page
			res.redirect('/times');
		}
	});
});

// handle create account forms:
routes.get('/delete-account', function(req, res) {
	Token.auth(req, res, (req, res, user) => {
		// delete user tokens
		Token.deleteToken(user.id);
		res.clearCookie('token');
		res.clearCookie('userId');
		
		// delete user in the database
		User.deleteUser(user.id);
		
		res.redirect('/sign-in');
	});
});

// show the sign-in page
routes.get('/sign-in', function(req, res) {
	res.render('sign-in.html');
});

routes.post('/sign-in', function(req, res) {
	signInForm.validate(req, res, 'sign-in.html', {}, (req, res, form) => {
		// find the user that's trying to log in
		var user = User.findByEmail(form.email);
		
		// if the user exists...
		if (user) {
			if (bcrypt.compareSync(form.password, user.passwordHash)) {
				// the hashes match! set the log in cookie
				res.cookie('userId', user.id, { signed: true });
				// and create a token for the user
				res.cookie('token', Token.generateToken(user.id), { signed: true });
				// redirect to main app:
				res.redirect('/times');
			} else {
				// if the username and password don't match, say so
				res.render('sign-in.html', {
					errorMessage: 'Email address and password do not match'
				});
			}
		} else {
			// if the user doesnt exist, say so
			res.render('sign-in.html', {
				errorMessage: 'No user with that email exists'
			});
		}
	});
});

// handle signing out
routes.get('/sign-out', function(req, res) {
	Token.deleteToken(req.signedCookies.userId);
	res.clearCookie('token');
	
	// clear the user id cookie
	res.clearCookie('userId');
	
	// redirect to the login screen
	res.redirect('/sign-in');
})

// list all job times
routes.get('/times', function(req, res) {
	Token.auth(req, res, (req, res, user) => {
		res.render('list-times.html', {
			user: user,
			stats: Session.getStats(user.id),
			times: Session.getSessions(user.id),
			isUser: true
		});
	});
});

// show the create time form
routes.get('/times/new', function(req, res) {
	Token.auth(req, res, (req, res, user) => {
		res.render('create-time.html', {
			user: user
		});
	});
});

// handle the create time form
routes.post('/times/new', function(req, res) {
	Token.auth(req, res, (req, res, user) => {
		sessionForm.validate(req, res, 'create-time.html', { user: user }, (req, res, form) => {
			Session.insert(user.id, form.startTime, form.duration, form.distance);
			
			res.redirect('/times');
		});
	});
});

// show the edit time form for a specific time
routes.get('/times/:id', function(req, res) {
	Token.auth(req, res, (req, res, user) => {
		var timeId = req.params.id;
		var session = Session.getSession(timeId);
		
		if (session !== null && session.user_id == user.id)
			res.render('edit-time.html', {
				user: user,
				time: session
			});
		else res.redirect('/times');
	});
});

// handle the edit time form
routes.post('/times/:id', function(req, res) {
	Token.auth(req, res, (req, res, user) => {
		var timeId = req.params.id;
		var session = Session.getSession(timeId);
		
		if (session.user_id == user.id)
			sessionForm.validate(req, res, 'edit-time.html', { user: user, time: session }, (req, res, form) => {
				Session.editSession(timeId, form.startTime, form.distance, form.duration);
			});
		
		res.redirect('/times');
	});
});

// handle deleteing the time
routes.get('/times/:id/delete', function(req, res) {
	Token.auth(req, res, (req, res, user) => {
		var timeId = req.params.id;
		
		if (session.user_id == user.id)
			Session.deleteSession(timeId);
		
		res.redirect('/times');
	});
});

// user page
routes.get('/user/:id', function(req, res) {
	Token.auth(req, res, (req, res, user) => {
		var visitee = User.findById(req.params.id);
		
		if (visitee !== null) {
			var isUser = (visitee.id == user.id);
			var follows = user.follows(visitee.id);
			
			res.render('list-times.html', {
				user: user,
				visitee: visitee,
				stats: Session.getStats(visitee.id),
				times: Session.getSessions(visitee.id),
				isUser: isUser,
				follows: follows
			});
		} else res.redirect('/times');
	});
});

routes.get('/follow/:id', function(req, res) {
	Token.auth(req, res, (req, res, user) => {
		var followee = User.findById(req.params.id);
		
		if (followee !== null)
			if (user.follows(followee.id))
				user.unfollow(followee.id);
			else user.follow(followee.id);
		
		res.redirect('/user/' + followee.id);
	});
});

routes.get('/followers', function(req, res) {
	Token.auth(req, res, (req, res, user) => {
		var followers = user.getFollowers();
		
		var users = [];
		var f;
		for (var i = 0; i < followers.length; i++) {
			f = followers[i];
			users.push({
				id: f.id,
				name: f.name,
				stats: Session.getStats(f.id)
			});
		}
		
		res.render('list-users.html', {
			user: user,
			users: users,
			emptyMsg: "You have no followers"
		});
	});
});

routes.get('/following', function(req, res) {
	Token.auth(req, res, (req, res, user) => {
		var following = user.getFollowing();
		
		var users = [];
		var f;
		for (var i = 0; i < following.length; i++) {
			f = following[i];
			users.push({
				id: f.id,
				name: f.name,
				stats: Session.getStats(f.id)
			});
		}
		
		res.render('list-users.html', {
			user: user,
			users: users,
			emptyMsg: "You aren't following anyone"
		});
	});
});

routes.get('/rankings', function(req, res) {
	Token.auth(req, res, (req, res, user) => {
		var rankings = Session.getRankings(user.id, "avg_speed");
		console.log(rankings);
		res.render('list-rankings.html', {
			user: user,
			stats: rankings,
			criteria: "Speed"
		});
	});
});

routes.get('/rankings/:id', function(req, res) {
	Token.auth(req, res, (req, res, user) => {
		var criteria = req.params.id;
		var posibilities = { speed: "avg_speed", distance: "total_distance", time: "total_time" };
		
		if (posibilities.hasOwnProperty(criteria.toLowerCase())) {
			var rankings = Session.getRankings(user.id, posibilities[criteria]);
			
			res.render('list-rankings.html', {
				user: user,
				stats: rankings,
				criteria: (criteria.charAt(0).toUpperCase() + criteria.slice(1))
			});
		} else res.redirect('/rankings');
	});
});

routes.get('/timeline', function(req, res) {
	Token.auth(req, res, (req, res, user) => {
		var times = Session.getTimeline(user.id);
		
		res.render('timeline.html', {
			user: user,
			times: times
		});
	});
});

module.exports = routes;
