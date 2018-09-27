var http = require('http');
var express = require('express');
var app = express();
var cors = require("cors");
var mysql = require("mysql");
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');

var port = process.env.PORT || 3000;
app.use(cors());
app.enable('trust proxy');
var router = express.Router();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var admin = false;

console.log("Port is " + port);

//Initiallising connection string
var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
	password: "password",
    database: "ocasta"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("Connected to database.");
});

router.get('/', function(req, res) {
	res.send("connected to server");
	console.log(req.headers['x-forwarded-for'] || req.connection.remoteAddress);
});


// Retrieves room usage over a period of time
router.get('/room/usage', function(req, res) {
	getSchedule(req.query.startDate, req.query.endDate, req.query.id).then(json => { 
		console.log(JSON.stringify(json));
		if (json.length > 0) {
			if (json[0].time != undefined) {
				for (var i = 0; i < json.length; i++) {
					json[i].room = {"id": json[i].id, "name": json[i].name};
					json[i].id = undefined;
					json[i].name = undefined;
				}
				res.send(json);
			}
		}
		else {
			res.status(500).send({"No results: ": json});
		}
	});
});

// Constructs and sends SQL request
function getSchedule(startDate, endDate, id) {
	var promise = new Promise(function(resolve, reject) {
		startDate = formatDate(new Date(startDate));
		endDate = formatDate(new Date(endDate));
		console.log(startDate + " " + endDate);
		var query = "SELECT schedule.time, schedule.user, rooms.id, rooms.name, schedule.available FROM rooms INNER JOIN schedule ON rooms.id=schedule.roomID " + ((id != undefined)?("WHERE rooms.id='" + id + "' ") : ("")) + "AND schedule.time > '"+ startDate + "' AND schedule.time < '"+ endDate + "' ORDER BY schedule.time;";
		console.log("query: " + query);
		connection.query(query, function (err, result) {
			if (err) throw err;
			//console.log("DB result: " + JSON.stringify(result));
			resolve(result);
		});
	});
	return promise;
}

// Get all room info
router.get('/room', function(req, res) {
	getRoom().then(json => {
		for (var i = 0; i < json.length; i++) {
			json[i].available = !!json[i].available;
		}
		console.log(JSON.stringify(json));
		res.send(json);		
	});
});

// Get all room info
router.get('/room/:id', function(req, res) {
	getRoom(req.params.id).then(json => { 
		if (json.length == 1) {
			json[0].available = !!json[0].available;
			console.log(JSON.stringify(json));
			res.send(json);
		}
		else {
			console.log({error: json});
			res.status(500).send({error: json});
		}
	});
});

// Request for room id info
function getRoom(id) {
	var promise = new Promise(function(resolve, reject) {
		var date = formatDate(new Date());
		var query = "SELECT rooms.id, rooms.name, schedule.available FROM rooms INNER JOIN schedule ON rooms.id=schedule.roomID "+((id!=undefined)?("WHERE rooms.id='" + id + "' ") : ("")) + "AND schedule.time < '"+ date + "' ORDER BY schedule.time"+((id!=undefined)?(" DESC limit 1;") : (""));
		connection.query(query, function (err, result) {
			if (err) throw err;
			//console.log("DB result: " + JSON.stringify(result));
			resolve(result);
		});
	});
	return promise;
}

// modify the name of a room
// modify the availability of a room's current booking
router.put('/room/:id', function(req, res) {
	if (req.body.available != undefined) {	
		setRoomCurrentAvailability(req.params.id, (req.body.available ? 1 : 0)).then(json => {
			console.log(JSON.stringify(json));
			if (json.affectedRows == 1)
				res.send("Successfuly updated database.");
			else {
				res.status(500).send({error: json});
			}
		});
	}
	else if (req.body.name != undefined) {
		var token = req.body.token|| req.headers['authorization'] || req.query.token || req.headers['x-access-token'];
		console.log("token: " + token);
		var decoded = jwt.verify(token.substring(7), 'secret');
		console.log("decode: " + JSON.stringify(decoded));
		
		if (!decoded) {
			res.status(403).send("Please login first.");
		}
		else {
			setRoomName(req.params.id, req.body.name).then(json => {
				console.log(JSON.stringify(json));
				if (json.affectedRows == 1)
					res.send("Successfuly updated database.");
				else {
					res.status(500).send({error: json});
				}
			});
		}
	}
	else {
		console.log("Invalid put body.")
		res.status(500).send({error: "Invalid put request body."})
	}
});

function setRoomName(id, state) {
	var promise = new Promise(function(resolve, reject) {
		var date = formatDate(new Date());
		var query = "UPDATE rooms SET name='" + state + "' WHERE id='" + id + "';";
		connection.query(query, function (err, result) {
			if (err) throw err;
			//console.log("DB result: " + JSON.stringify(result));
			resolve(result);
		});
	});
	return promise;
}

// Update database RoomCurrentAvailability
function setRoomCurrentAvailability(id, state) {
	var promise = new Promise(function(resolve, reject) {
		var date = formatDate(new Date());
		var query = "UPDATE schedule SET schedule.available=" + state + "  WHERE roomID='" + id + "' AND schedule.time < '"+ date + "' ORDER BY schedule.time DESC limit 1;";
		connection.query(query, function (err, result) {
			if (err) throw err;
			//console.log("DB result: " + JSON.stringify(result));
			resolve(result);
		});
	});
	return promise;
}

// Create new room
router.post('/room', function(req, res) {
	var token = req.body.token|| req.headers['authorization'] || req.query.token || req.headers['x-access-token'];
	console.log("token: " + token);
	var decoded = jwt.verify(token.substring(7), 'secret');
	console.log("decode: " + JSON.stringify(decoded));
	
	if (!decoded) {
		res.status(403).send("Please login first.");
	}
	else {
		createNewRoom(req.body.name).then(json => { 
			console.log(JSON.stringify(json));
			if (json.affectedRows == 1)
				res.send("Successfuly create new room.");
			else {
				res.status(500).send({error: json});
			}
		});
	}
});

function createNewRoom(name) {
	var promise = new Promise(function(resolve, reject) {
		formatDate(new Date());
		var query = "INSERT INTO rooms VALUES ('" + formatDate(new Date()) + "', '" + name + "');";
		connection.query(query, function (err, result) {
			if (err) throw err;
			//console.log("DB result: " + JSON.stringify(result));
			resolve(result);
		});
	});
	return promise;
}

router.post('/admin', function(req, res) {
	if (req.body.username == "admin"
		&& req.body.password == "admin") {
		var token = jwt.sign({ foo: 'bar' }, 'secret');
		res.send(token);
	}
	else {
		res.status(401).send("Incorrect credentials.");
	}
});

function formatDate(date) {
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + " " + hour + ":" + min + ":" + sec;
}

app.use('/', router);
app.listen(port);