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

// Initialize location for debug
var current_location = 'Kraków';

app.use(express.static(publicPath));

// Socket.io onConnection
io.on('connection', function(socket) {

    socket.on('createMessage', function(message) {
        console.log("Server recieved :" + JSON.stringify(message))

        getCurrentLocation(message.text).then(function(result){
			// Build current user
			io.emit('userInfo', result);
			findFollowers(message.text);
			io.emit('setLoading', "");	
		}, function(err){
			io.emit('addError', err);			
		});
		
		// Debug:
		// var dict = [
			// {"key":"plnice","value":"Cracow, Poland"},
			// {"key":"cusspvz","value":"PÃ³voa de Varzim, Porto, Portugal"},
			// {"key":"THenry14","value":null},{"key":"Jarema","value":"Poland"},
			// {"key":"brunocasanova","value":"PÃ³voa de Varzim, Porto, Portugal"},
			// {"key":"mgwhitfield","value":"Boulder, CO"},
			// {"key":"Svarkovsky","value":"Ukraine"},
			// {"key":"slapab","value":"Krakow"},
			// {"key":"hagom","value":null},
			// {"key":"szemek","value":"GdaÅsk, Poland"},
			// {"key":"Faridoladzad","value":"IRAN"},
			// {"key":"blueness","value":"Buffalo NY, USA."},
			// {"key":"angusshire","value":"Berkeley, CA"},
			// {"key":"akatrevorjay","value":"San Francisco"},
			// {"key":"MLateralus","value":"Krakow"},
			// {"key":"mklimuk","value":"France"}
			// ];
		// io.emit('setLoading', "");
		// handleFullResponse(dict)
	});
});

// function: getCurrentLocation
	/*	params: git_profile, callback -> as a function
	*	returns: undefined
	*	desc: makes git api call, to retrieve the location of searched user
	*/
function getCurrentLocation(git_profile, callback){
	io.emit('logWork', "Getting current user location ...");
	var url_stream = 'https://api.github.com/users/' + git_profile;
	return new Promise(function(resolve, reject){
		makeGitCall(url_stream).then(function(result){
			resolve(result);
		}, function(err){
			reject("Profile could not be resolved")
		});
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
	makeGitCall(url_stream).then(function(result){
		getFollowersProfile(result);
	}, function(err){
		io.emit('addError', "Profile could not be resolved");
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
		makeGitCall(url_stream).then(function(result){
			followers.push({
				key: result.login,
				value: result.location
			});
			iterator_flag += 1;
			if(iterator_flag == profiles.length){
				handleFullResponse(followers);
			}
		}, function(err){
			io.emit('addError', err);
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
	var iterator_flag = 0;
	var returnArr = [];
	

	dict.forEach(function(elem, i){
		if(elem.value == null){
			console.log("Clearing ut the null: "+ elem.key)
			dict.splice(i, 1)	
		}
	});
	
	dict.forEach(function(elem){
		calculateDistance(elem.value, function(result, city){
			// Build a proper object to send back
			returnArr.push({
				"user": elem.key,
				"city": city,
				"distance": result
			});
			iterator_flag += 1;
			if(iterator_flag == dict.length){
				sendBack(returnArr);
			}
		})
	});
}

// function: sendBack
	/*	params: returnArr
	*	returns: undefined
	*	desc: send event back to client, with Array of results
	*/
function sendBack(returnArr){
	io.emit('clearLoading', "");
	if(!returnArr.includes("Unable to connect to api.github") || !returnArr.includes("Unable to retrieve from www.dystans.org")){
		io.emit('addInfo', returnArr); 
	}

}

// function: calculateDistance
	/*	params: city, callback as a function
	*	returns: undefined
	*	desc: calls an API of dystans.org to get distance in between the current 
			user city, and the city of one of their followers.
	*/
function calculateDistance(city, callback){
	url_stream = "http://www.dystans.org/route.json?stops=" + current_location + "|" + city
	makeDystansCall(url_stream).then(function(result){
		callback(result, city)
	}, function(err){
		io.emit('addError', err);
	});
}

// function: makeGitCall
	/*	params: url_stream, callback as a function
	*	returns: undefined
	*	desc: Generic GitHub API call to retrieve anything found under the url_stream param.
			and then pass it to the callback function
	*/
var makeGitCall = function (url_stream){
	return new Promise(function(resolve, reject){
		request({
			url: url_stream,
			json: true,
			headers: {
				'User-Agent': 'Majkel-App'
			}
		},
		function(error, response, body){
			if(!error && response.statusCode === 200){
				resolve(response.body);
			} else {
				reject("Unable to connect to api.github");
				// io.emit('clearLoading', "");
			}
		});
	});
}

// function: makeDystansCall
	/*	params: url_stream, callback as a function
	*	returns: undefined
	*	desc: Generic Dystans.org API call to retrieve anything found under the url_stream param.
			and then pass the distance between input cities.
	*/
var makeDystansCall = function (url_stream, callback){
	return new Promise(function (resolve, reject){
		request({
			url: url_stream,
			json: true,
		},
		function(error, response, body){
			if(!error && response.statusCode === 200){
				resolve(response.body.distance);
			} else {
				reject("Unable to retrieve from www.dystans.org");
				io.emit('clearLoading', "");
			}
		});
	});
}


server.listen(port, function(){
	console.log('server is up on port: ' + port);
});