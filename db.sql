CREATE SCHEMA IF NOT EXISTS ocasta;

USE ocasta;

DROP TABLE rooms;
DROP TABLE schedule;

CREATE TABLE rooms (
	id VARCHAR(20) PRIMARY KEY NOT NULL,
	name VARCHAR(30)
);

CREATE TABLE schedule (
	time TIMESTAMP NOT NULL,
	user VARCHAR(30),
	available BOOLEAN,
	roomID VARCHAR(20),
	FOREIGN KEY (roomID) REFERENCES rooms(id),
	
	UNIQUE(time, roomID)
);

INSERT INTO rooms VALUES ("abc123", "Situation Room");
INSERT INTO rooms VALUES ("nts864", "Casa Del Popolo");
INSERT INTO rooms VALUES ("orb390", "Cambrai Cathedral");

INSERT INTO schedule VALUES("2018-09-27 09:00:00", "Jeff", false, "abc123");
INSERT INTO schedule VALUES("2018-09-27 10:00:00", "Jeff", true, "abc123");
INSERT INTO schedule VALUES("2018-09-27 09:00:00", "Tony", false, "nts864");
INSERT INTO schedule VALUES("2018-09-29 10:00:00", "Tony", true, "nts864");

"SELECT rooms.id, rooms.name, schedule.available FROM rooms INNER JOIN schedule ON rooms.id=schedule.roomID WHERE rooms.id='" + id + "' AND schedule.time < '2018-09-27 09:30:00' ORDER BY schedule.time DESC limit 1;"

SELECT rooms.id, rooms.name, schedule.available FROM rooms INNER JOIN schedule ON rooms.id=schedule.roomID WHERE schedule.time < '2018-09-30 09:00:00' ORDER BY schedule.time;

UPDATE schedule SET schedule.available=1 WHERE roomID='abc123' AND schedule.time < '2018-09-27 10:00:00' ORDER BY schedule.time DESC limit 1;

UPDATE rooms SET name='Cathedral of the Deep' WHERE id='abc123';

SELECT schedule.time, schedule.user, rooms.id, rooms.name, schedule.available FROM rooms INNER JOIN schedule ON rooms.id=schedule.roomID WHERE schedule.time > '2018-09-27 06:00:00' AND schedule.time < '2018-10-10 09:00:00' ORDER BY schedule.time;