var { db, helpers } = require('../database');
var User = require('./User');
var bcrypt = require('bcryptjs');
var saltRounds = 10;
var tokenTimeout = "'-2 hour'";

class Token {
	static deleteOldTokens() {
		helpers.runAndExpectNoRows('DELETE FROM token WHERE timestamp <= date(\'now\', ?)', [tokenTimeout]);
	}
	
	static deleteToken(userId) {
		helpers.runAndExpectNoRows('DELETE FROM token WHERE user_id = ?', [userId]);
	}
	
	static getToken(userId) {
		var row = helpers.getRow('SELECT * FROM token WHERE user_id = ?', [userId]);
		
		if (row === null)
			return null;
		else return row.token;
	} 
	
	static generateToken(userId) {
		var token = Math.floor(4294967295 * Math.random()).toString(16);
		var tokenHash = bcrypt.hashSync(token, saltRounds);
		
		helpers.runAndExpectNoRows('DELETE FROM token WHERE user_id = ?', [userId]);
		helpers.insertRow('INSERT INTO token (user_id, token) VALUES (?, ?)', [userId, tokenHash]);
		
		return token;
	}
	
	// authenticates that the user is logged in
	static auth(req, res, func) {
		var user = User.findById(req.signedCookies.userId);
		
		if (user !== null) {
			var userId = user.id;
			var oldToken = req.signedCookies.token;
			
			Token.deleteOldTokens();
			var oldTokenHash = Token.getToken(userId);
			
			if (oldToken !== undefined && oldTokenHash !== null &&
				bcrypt.compareSync(oldToken, oldTokenHash)) {
				var newToken = Token.generateToken(userId);
				res.cookie('token', newToken, { signed: true });
				
				func(req, res, user);
				return true;
			}
		}
		
		res.redirect('/sign-in');
		return false;
	}
}

module.exports = Token;