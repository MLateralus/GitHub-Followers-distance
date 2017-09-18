var socket = io();

var responseDistance = document.getElementById("responseHTML");
var responseImage = document.getElementById("userInfoImage");
var responseText = document.getElementById("userInfoText");

// Builds basic info about current searched user
socket.on('userInfo', function(userObj) {
    var userImage = document.createElement("img");
    userImage.style.width = "60%";
    userImage.style.height = "60%";
    userImage.src = userObj.avatar_url;
    responseImage.appendChild(userImage);

    // Log some interesting values of current user
    // Build a list of elements in style of list.
    var pointsOfInterest = ["login", "id", "name", "company", "location", "email", "bio", "public_repos", "created_at"];
    var list = document.createElement("ul");
    for (property in userObj) {
        if (userObj.hasOwnProperty(property)) {
            if (pointsOfInterest.includes(property) && userObj[property] != null) {
                var listElem = document.createElement("li");
                listElem.innerHTML = property + ": " + userObj[property];
                list.appendChild(listElem);
            }
        }
    }
    responseText.appendChild(list);

});

socket.on('addInfo', function(returnArr) {
    console.log("addInfoMessage: ", returnArr);

    var sortedArr = returnArr.sort(function(a, b) {
        return b.distance - a.distance;
    });

    if (returnArr.length > 10) {
        sortedArr = sortedArr.slice(0, 10);
    }
	var header = document.createElement("span");
	header.style.display = "block";
	header.style.fontSize = "large";
	header.style.margin = "50px";
	header.innerHTML = "Non-null city -> Followers distance";
	responseDistance.appendChild(header);
	
    var table_responsive = document.createElement("div");
    table_responsive.className = "table-responsive";
    var table = document.createElement("table");
    table.className = "table";
    sortedArr.forEach(function(elem, index) {
        var record = document.createElement("tr");
        record.style.borderBottom = "1pt solid";
        var row1 = document.createElement("td");
        var row2 = document.createElement("td");
        var row3 = document.createElement("td");
        row1.innerHTML = elem.user;
        row2.innerHTML = elem.city;
        row3.innerHTML = elem.distance + " km";
        record.appendChild(row1);
        record.appendChild(row2);
        record.appendChild(row3);
        console.log("record: " + record);
        table.appendChild(record);
        console.log("table: " + table);
    });

    table_responsive.appendChild(table);
    responseDistance.appendChild(table_responsive);

});

socket.on('addError', function(message) {
    responseDistance.innerHTML = message;
});

socket.on('setLoading', function(message) {
    var cat_loading = document.createElement("img");
    cat_loading.src = "/img/cat.gif";
    cat_loading.title = "Loading";
    cat_loading.alt = "Loading";
    cat_loading.style.display = "block";
    cat_loading.style.margin = "0px auto";
    cat_loading.style.height = "50%";
    cat_loading.style.width = "50%";
    responseDistance.appendChild(cat_loading);
});

socket.on('clearLoading', function(message) {
    responseDistance.innerHTML = '';
});

socket.on('logWork', function(message) {
    console.log(message);
});

var button = document.getElementById("senderButton");
var field = document.getElementById("nickname");

button.addEventListener("click", function(e) {
    e.preventDefault();
    responseDistance.innerHTML = '';
    responseImage.innerHTML = '';
    responseText.innerHTML = '';
    socket.emit('createMessage', {
        text: field.value,
        author: "Client",
    });
});