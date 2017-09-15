// Modules
const path = require('path');
const http = require('http');
const request = require('request');
const express = require('express');
const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
const socketIO = require('socket.io');

// Express routes set-up
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var current_location = 'Kraków';

app.use(express.static(publicPath));

// Socket.io onConnection
io.on('connection', function(socket){

	socket.on('createMessage', function (message){
		console.log("Server recieved :" + JSON.stringify(message))

		getCurrentLocation(message.text, function(result){
			current_location = result.location;
			findFollowers(message.text);
			
			// Debug: 
			//var dict = [{"MToska": "Berlin"}, {"dolohow": "Cracow"}, {"THenry": "Sydney"}];
			//handleFullResponse(dict)
		});
		
		// Debug:
		//var dict = [{"MToska": "Moscow"}, {"dolohow": "Lublin"}, {"THenry": "Amsterdam"}];
		//handleFullResponse(dict)
	});
});

// function: getCurrentLocation
	/*	params: git_profile, callback -> as a function
	*	returns: undefined
	*	desc: makes git api call, to retrieve the location of searched user
	*/
function getCurrentLocation(git_profile, callback){
	
	io.emit('logWork', "Getting current user location ...");
	var url_stream = 'https://api.github.com/users/' + git_profile
	makeGitCall(url_stream, function(errorMessage, result){
		if(errorMessage){
			io.emit('addInfo', "Profile could not be resolved");
		} else {
			callback(result);
		}
	});
}

// function: findFollowers
	/*	params: git_profile
	*	returns: undefined
	*	desc: gets the user's followers
	*/
function findFollowers(git_profile){
	
	io.emit('logWork', "Finding profile followers ...");
	var url_stream = 'https://api.github.com/users/' + git_profile + '/followers';
	makeGitCall(url_stream, function(errorMessage, result){
		if(errorMessage){
			io.emit('addInfo', "Profile could not be resolved");
		} else {
			getFollowersProfile(result);
		}
	});
}

// function: getFollowersProfile
	/*	params: profiles
	*	returns: undefined
	*	desc: builds a user: location relationship in a form of array of objects
	*		each user has been querried for their location from personal profile.
	*/
function getFollowersProfile(profiles){

	var iterator_flag = 0;
	var followers = [];

	io.emit('logWork', "Getting each profile location ...");
	profiles.forEach(function(elem){
		var url_stream = 'https://api.github.com/users/' + elem.login;
		makeGitCall(url_stream, function(errorMessage, result){
			if(errorMessage){
				io.emit('addInfo', errorMessage);
			} else {
				followers.push({
					key: result.login,
					value: result.location
				});
				iterator_flag += 1;
				if(iterator_flag == profiles.length){
					handleFullResponse(followers);
				}
			}
		});
	});	
}

// function: handleFullResponse
	/*	params: dict
	*	returns: undefined
	*	desc: parse the user: location pairing to check for distance
	*/
function handleFullResponse(dict){

	io.emit('logWork', "Working with locations ...");
	
	// Debug
	console.log("current location: " + current_location)
	console.log("dict: " + JSON.stringify(dict));
	
	dict.forEach(function(elem){
		calculateDistance(elem.value, function(result, city){
			// console.log("Dystans between :" + current_location + " and: " + city + " is equal: " + result + "km")
			io.emit('addInfo', "Dystans between :" + current_location + " and: " + city + " is equal: " + result + "km" + "\n"); 
		})
	})
	

}

// function: calculateDistance
	/*	params: city, callback as a function
	*	returns: undefined
	*	desc: calls an API of dystans.org to get distance in between the current 
			user city, and the city of one of their followers.
	*/
function calculateDistance(city, callback){
	url_stream = "http://www.dystans.org/route.json?stops=" + current_location + "|" + city
	makeDystansCall(url_stream, function(errorMessage, result){
		if(errorMessage){
			io.emit('addInfo', errorMessage);
		} else {
			callback(result, city)
		}
	});
}

// function: makeGitCall
	/*	params: url_stream, callback as a function
	*	returns: undefined
	*	desc: Generic GitHub API call to retrieve anything found under the url_stream param.
			and then pass it to the callback function
	*/
var makeGitCall = function (url_stream, callback){
	request({
		url: url_stream,
		json: true,
		headers: {
			'User-Agent': 'Majkel-App'
			}
		},
	function(error, response, body){
		if(!error && response.statusCode === 200){
			callback(undefined, response.body);
		} else {
			callback("Unable to connect to api.github", undefined);
		}
	});
}

// function: makeDystansCall
	/*	params: url_stream, callback as a function
	*	returns: undefined
	*	desc: Generic Dystans.org API call to retrieve anything found under the url_stream param.
			and then pass the distance between input cities.
	*/
var makeDystansCall = function (url_stream, callback){
	request({
		url: url_stream,
		json: true,
	},
	function(error, response, body){
		if(!error && response.statusCode === 200){
			callback(undefined, response.body.distance);
		} else {
			callback("Unable to retrieve from www.dystans.org", undefined);
		}
	});
}


server.listen(port, function(){
	console.log('server is up on port: ' + port);
});