var socket = io();


socket.on('addInfo', function (message){
	console.log("addInfoMessage: ", message);
	var response = document.getElementById("responseHTML");
	response.innerHTML += message;
});

socket.on('logWork', function (message){
	console.log(message);
});

var button = document.getElementById("senderButton");
var field = document.getElementById("nickname");

button.addEventListener("click", function (e){
	e.preventDefault();
	socket.emit('createMessage', {
		text: field.value,
		author: "Client",
	});
});
