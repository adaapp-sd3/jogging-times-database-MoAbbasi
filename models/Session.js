var { db, helpers } = require('../database');

class Session {
	static insert(userId, startTime, duration, distance) {
		var sessionId = helpers.insertRow('INSERT INTO session (user_id, start_time, duration, distance, avg_speed) VALUES (?, ?, ?, ?, ?)', [userId, startTime, duration, distance, getAvgSpeed(distance, duration)]);
		
		return sessionId;
	}
	
	static editSession(sessionId, startTime, distance, duration) {
		helpers.runAndExpectNoRows('UPDATE session SET start_time = ?, duration = ?, distance = ?, avg_speed = ? WHERE id = ?', [startTime, duration, distance, getAvgSpeed(distance, duration), sessionId]);
	}
	
	static deleteSession(sessionId) {
		helpers.runAndExpectNoRows('DELETE FROM session WHERE id = ?', [sessionId]);
	}
	
	static getStats(userId) {
		var row = helpers.getRow('SELECT SUM(distance) total_distance, SUM(duration) total_time, AVG(avg_speed) avg_speed FROM session WHERE user_id = ? GROUP BY user_id', [userId]);
		
		return new Stats(row);
	}
	
	static getSessions(userId) {
		var rows = helpers.getRows('SELECT * FROM session WHERE user_id = ? ORDER BY start_time DESC', [userId]);
		
		var sessions = [];
		for (var i = 0; i < rows.length; i++)
			sessions.push(new Session(rows[i]));
		
		return sessions;
	}
	
	static getTimeline(userId) {
		var rows = helpers.getRows('SELECT * FROM (session NATURAL JOIN follower) a INNER JOIN user ON user.id = a.user_id WHERE follower_id = ? OR user_id = ? ORDER BY start_time DESC', [userId, userId]);
		var posts = [];
		
		for (var i = 0; i < rows.length; i++) {
			posts.push(new Session(rows[i]));
			posts[i].name = rows[i].name;
		}
		
		return posts;
	}
	
	static getRankings(userId, criteria) {
		var rows = helpers.getRows('SELECT name, user_id, SUM(distance) total_distance, SUM(duration) total_time, AVG(avg_speed) avg_speed FROM (session NATURAL JOIN follower) a INNER JOIN user ON user.id = a.user_id WHERE follower_id = ? OR user_id = ? GROUP BY user_id', [userId, userId]);
		
		rows.sort((a, b) => {
			return b[criteria] - a[criteria];
		});
		
		var rankings = [];
		for (var i = 0; i < rows.length; i++) {
			rankings.push(new Stats(rows[i]));
			rankings[i].id = rows[i].user_id;
			rankings[i].name = rows[i].name;
			rankings[i].rank = i + 1;
		}
		
		return rankings;
	}
	
	static getSession(sessionId) {
		var row = helpers.getRow('SELECT * FROM session WHERE id = ?', [sessionId]);
		
		if (row)
			return new Session(row);
		else return null;
	}
	
	constructor(databaseRow) {
		this.id			= databaseRow.id;
		this.userId		= databaseRow.user_id;
		this.startTime	= formatDateForHTML(databaseRow.start_time);
		this.duration	= databaseRow.duration;
		this.distance	= databaseRow.distance;
		this.avgSpeed	= databaseRow.avg_speed;
	}
}

class Stats {
	constructor(databaseRow) {
		if (databaseRow !== null) {
			this.totalDistance	= databaseRow.total_distance.toFixed(2);
			this.totalTime		= databaseRow.total_time.toFixed(2);
			this.avgSpeed		= databaseRow.avg_speed;
		} else {
			this.totalDistance	= 0;
			this.totalTime		= 0;
			this.avgSpeed		= 0;
		}
	}
}

function getAvgSpeed(distance, duration) {
	if (duration != 0)
		return (distance / duration).toFixed(2);
	else return 0;
}

function formatDateForHTML(date) {
	return new Date(date).toISOString().slice(0, -8);
}

module.exports = Session;