const express = require('express');
const Tile38 = require('tile38');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');


const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT'],
  },
});

const port = 3000;

// Connect with Tile38 (default localhost:9851)
const client = new Tile38();

// Allow to receive json in request body.
app.use(express.json());

// Allow all origin
app.use(cors({ origin: '*' }));


/**
 * Send the position (ex: cellphone, robot)
 * Payload example:
 * {
 *   "id": "robot1",
 *   "lat": -3.71722,
 *   "lon": -38.5433
 * }
 */
app.put('/location', async (req, res) => {
  const { id, lat, lon } = req.body;

  if (!id || !lat || !lon) {
    return res.status(400).json({ error: 'id, lat and lon are required' });
  }

  try {
    console.log("[put location]:", req.body);
    const response = await client.set('users', id, [lat, lon]);
    res.json({ success: true, response });
  } catch (err) {
    console.error('Error when trying to save position:', err);
    res.status(500).json({ error: 'Internal server error', err });
  }
});



app.get('/location', async (req, res) => {  
    try {
      const response = await client.get('users', 'robot1');
      res.json(response);
    } catch (err) {
      console.error('Error when trying to get positions:', err);
      res.status(500).json({ error: 'Internal server error', err });
    }
});


app.get('/rooms', async (req, res) => {  
    try {
        const response = await client.get('rooms', 'room_office');
        res.json(response);
    } catch (err) {
      console.error('Error when trying to get rooms:', err);
      res.status(500).json({ error: 'Internal server error', err });
    }
});
  



app.get('/nearby', async (req, res) => {
    const { lat, lon, radius = 60000 } = req.query;
  
    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat e lon are required' });
    }
  
    try {
        const result = await client.nearbyQuery('users').distance().point(parseFloat(lat), parseFloat(lon), parseFloat(radius)).execute();
        res.json(result);
    } catch (err) {
      console.error('Error searching for nearby objects', err);
      res.status(500).json({ error: 'Internal Error' });
    }
});


app.post('/webhook', (req, res) => {
    console.log('Event received from Tile38:', JSON.stringify(req.body, null, 2));
    io.emit('tile38-event', req.body);
    res.sendStatus(200);
});

const initializeHook = async () => {

    const geojson = {
        type: "Polygon",
        coordinates: [
          [
            [-38.560253151, -3.743789153],
            [-38.560366558, -3.743880912],
            [-38.560349369, -3.743901897],
            [-38.560235962, -3.743810138],
            [-38.560253151, -3.743789153]
          ]
        ]
      };
      

    try {

        const meta = { room: 'office' };
        const response1 = await client.set('rooms', 'room_office', geojson);
        let opts = {
            get: ['rooms', 'room_office'],
            detect: 'enter, exit',
        };
        const response2 =  await client.setHook('room-hook', 'http://192.168.0.13:3000/webhook', meta, 'within', 'users', opts)
        console.log(response1);
        console.log(response2);
        console.log('[Tile38] Hook successfully configured.');
    } catch (err) {
        console.error('[Tile38] Error when try to onfigure hook:', err);
    }
    
}



// Websocket client 

io.on('connection', (socket) => {
  console.log('[WebSocket] Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('[WebSocket] Client disconnected:', socket.id);
  });
});



server.listen(port, () => {
  initializeHook();
  console.log(`Server running in http://localhost:${port}`);
});