var { db, helpers } = require('../database');

class User {
	static insert(name, email, passwordHash) {
		var userId = helpers.insertRow('INSERT INTO user (name, email, password_hash) VALUES (?, ?, ?)', [name, email, passwordHash]);
		
		return userId;
	}
	
	static deleteUser(userId) {
		helpers.runAndExpectNoRows('DELETE FROM user WHERE id = ?', [userId]);
	}

	static findById(id) {
		var row = helpers.getRow('SELECT * FROM user WHERE id = ?', [id]);

		if (row)
			return new User(row);
		else
			return null;
	}

	static findByEmail(email) {
		var row = helpers.getRow('SELECT * FROM user WHERE email = ?', [email]);

		if (row)
			return new User(row);
		else return null;
	}
	
	constructor(databaseRow) {
		this.id = databaseRow.id;
		this.name = databaseRow.name;
		this.email = databaseRow.email;
		this.passwordHash = databaseRow.password_hash;
	}
	
	follow(userId) {
		helpers.insertRow('INSERT INTO follower (user_id, follower_id) VALUES (?, ?)', [userId, this.id]);
	}
	
	unfollow(userId) {
		helpers.runAndExpectNoRows('DELETE FROM follower WHERE user_id = ? AND follower_id = ?', [userId, this.id]);
	}
	
	follows(userId) {
		var row = helpers.getRow('SELECT * FROM follower WHERE user_id = ? AND follower_id = ?', [userId, this.id]);
		
		return row !== null;
	}
	
	getFollowers() {
		var rows = helpers.getRows('SELECT * FROM follower WHERE user_id = ?', [this.id]);
		var followers = [];
		
		for (var i = 0; i < rows.length; i++)
			followers.push(User.findById(rows[i].follower_id));
		
		return followers;
	}
	
	getFollowing() {
		var rows = helpers.getRows('SELECT * FROM follower WHERE follower_id = ?', [this.id]);
		var following = [];
		
		for (var i = 0; i < rows.length; i++)
			following.push(User.findById(rows[i].user_id));
		
		return following;
	}
}

module.exports = User;
