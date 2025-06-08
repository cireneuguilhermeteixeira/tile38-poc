# 🛰️ POC: Geospatial Tracking with Tile38 + Node.js + React Native (Expo)

This proof of concept (POC) demonstrates the use of [Tile38](https://github.com/tidwall/tile38), an in-memory geospatial database, together with a Node.js backend and a frontend developed with Expo/React Native (with web support). The goal is to detect, in real time, when a mobile device enters or leaves a specific geographic area — in this case, **the floor plan of my house**.

---

## 🗂️ Installing the Tile38 Database

1. Clone the official repository:

```bash
git clone https://github.com/tidwall/tile38.git
cd tile38
```


2. Install Go (Golang).

3. Compile and start the server:
```
go build
./tile38-server
```

Tile38 will be available locally on port 9851.

# 🧠 Node.js Backend

- 🔗 Connecting to Tile38
The backend uses the tile38 library to interact with the database and exposes the following endpoints:

- 📡 REST Endpoints

- GET `/location`: Returns the last saved location of the object (e.g. robot1).

- PUT `/location`: Updates the location of an object based on its id, lat and lon.


Example payload:
```
{
"id": "robot1",
"lat": -3.7439,
"lon": -38.5603
}
```

GET `/nearby`: Query objects near a coordinate.

Example:


```
GET `/nearby?lat=-3.7439&lon=-38.5603&radius=50`
```


# 🛰️ Webhooks with SETHOOK
The backend configures a SETHOOK in Tile38 that monitors entry and exit events within a geographic area defined as a GeoJSON polygon.

The URL configured in the webhook is POST /webhook.

When an object enters or leaves the area, Tile38 sends a request to the backend.

The backend retransmits this event via WebSocket to the Expo application.

## 🧮 Comparison: `tile38` Library (Node.js) vs Native Tile38 Commands

During the implementation of the backend, two styles of interaction with Tile38 were used: using the official `tile38` library for Node.js and also native Tile38 commands (as if they were sent directly by the CLI).

Below are direct examples of what was implemented:

| 📦 Node.js command (`tile38` lib) | ⚙️ Equivalent Tile38 CLI command |
|------------------------------------------------------------------|-----------------------------------------------|
| `await client.get('users', 'robot1');` | `GET users robot1` |
| `await client.set('users', id, [lat, lon]);` | `SET users <id> POINT <lat> <lon>` |
| `await client.get('rooms', 'room_office');` | `GET rooms room_office` |
| `await client.set('rooms', 'room_office', geojson);` | `SET rooms room_office OBJECT { ... }` |
| `await client.nearbyQuery('users').distance().point(lat, lon, radius).execute();` | `NEARBY users DISTANCE POINT <lat> <lon> <radius>` |
| `await client.setHook('room-hook', 'http://<ip>/webhook', meta, 'within', 'users', opts);` | `SETHOOK room-hook http://<ip>/webhook FENCE DETECT enter,exit WITHIN users GET rooms room_office` |

### 📌 Notes

- The `tile38` library provides chainable methods and makes it easier to manipulate GeoJSON, but it has **limited support** for more complex commands such as `SETHOOK`.

- In some cases, the `client.sendCommand(...)` method was used to send native commands as strings, especially for setting geofences with `WITHIN` and `FENCE`.

**Conclusion**: For simple commands and basic interactions with Tile38, the library is practical and readable. However, for **advanced features**, it is recommended to use the native command (via string) or the CLI directly.

---

# 📱 Frontend with Expo + React Native

The mobile application was developed using Expo with support for Android, iOS and Web.

# 🔧 Features:

- Real-time location collection with expo-location.

- Automatic sending of the current position to the backend via HTTP (PUT /location).

- Receiving events via WebSocket (entry/exit of the monitored area).

- 2D map rendering with the house plan and the user's current position.

- Status detection: "Inside", "Outside", or "Unknown".

- The tracking area was defined based on the real coordinates of my home. The polygon was drawn manually and normalized to accurately represent the house plan.

# 🧪 Demonstration
The video below shows the application working in real time: as I walk through the rooms of my house, the cell phone's location is updated and the system automatically detects when I leave or enter the defined geographic area.


# 📹 DEMO


# 🛠️ Technologies Used
- Tile38 – In-memory geospatial database

- Node.js + Express + Socket.io – Backend server and real-time communication

- React Native + Expo – Frontend application

- expo-location – GPS location collection

- GeoJSON – Representation of the geographic area in polygonal format

- WebSockets – Real-time event notifications (via Tile38 hook)

All events are based on the GPS location obtained directly by the cell phone.
The tracked area was carefully adjusted based on real tests within the residence's floor plan.
