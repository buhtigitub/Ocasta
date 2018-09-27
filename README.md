# Ocasta
Challenge

- Implemented in Node.js and MySQL.
- The database implementation is a one-to-many relationship between rooms and timetabled events (i.e. room in use, room free) .
- Availability is looked up in the schedule table.
- Modifiying a rooms availability modifies the current timetable event.
- JWT tokens are used to authenticate admin API calls.
- Room IDs are creation timestamps.
- Schedule entries are unique contrained by time and room.
- User input is escaped for security.
- Solution doesn't implement a check for availability when booking a room, though rooms aren't really bookable through this API.
- Admin username/password is stored on server, not looked up in DB.
