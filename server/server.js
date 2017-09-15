const path = require('path');
const http = require('http');
const request = require('request');
const express = require('express');
const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
const socketIO = require('socket.io');

var app = express();
var server = http.createServer(app);
var io = socketIO(server);

app.use(express.static(publicPath));

io.on('connection', function(socket){

	socket.on('createMessage', function (message){
		console.log("Server recieved :" + JSON.stringify(message))
		X(message.text);
	});
});

function X(git_profile){
	
	var url_stream = 'https://api.github.com/users/' + git_profile + '/followers';
	
	makeGitCall(git_profile, url_stream, function(errorMessage, result){
		if(errorMessage){
			io.emit('addInfo', "Profile could not be resolved");
		} else {
			var t = getFollowersProfile(result);
			console.log(t)
			// io.emit('addInfo', JSON.stringify(result)); 
		}
	});
}

function getFollowersProfile(profiles){
	
	profiles.forEach(function(elem){
		var followers = {};
		var url_stream = 'https://api.github.com/users/' + elem.login;
		
		makeGitCall(elem.login, url_stream, function(errorMessage, result){
			if(errorMessage){
				io.emit('addInfo', errorMessage);
			} else {
				followers[result.login] = result.location
				// console.log(result.login + ": " +  result.location);
			}
		});
		return followers;
	});	
}

var makeGitCall = function (git_profile, url_stream, callback){
	console.log("url.sttream: " + url_stream )
	var urlStream = url_stream
	request({
		url: urlStream,
		json: true,
		headers: {
			'User-Agent': 'Majkel-App'
			}
		},
	function(error, response, body){
		if(!error && response.statusCode === 200){
			console.log("successful call!")
			callback(undefined, response.body);
		} else {
			console.log("unsuccessful call!")
			callback("Unable to connect...", undefined);
		}
	});
}

// var getLocation = function (git_profile, callback){
	// var urlStream = 'https://api.github.com/users/' + git_profile;
	// request({
		// url: urlStream,
		// json: true,
		// headers: {
			// 'User-Agent': 'Majkel-App'
			// }
		// },
	// function(error, response, body){
		// if(!error && response.statusCode === 200){
			// callback(undefined, response.body);
		// } else {
			// callback("Unable to connect...", undefined);
		// }
	// });
// }

server.listen(port, function(){
	console.log('server is up on port: ' + port);
});



