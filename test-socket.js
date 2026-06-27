const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

const SECRET = '24e196076f6e10b79476d01522b66a5d20964e0281e0438c88dc245469bfc396d8d8115e81fa349d36e3dd93470a86334035dd83084010dc5a7fd8065c7fa9e0';
const URL = 'https://rushes-call.onrender.com';

const token = jwt.sign({
  id: 'test-user-id',
  userId: 'test-user-id',
  username: 'Test User',
}, SECRET, { expiresIn: '1h' });

console.log('Testing socket connection to', URL);

const socket = io(URL, {
  auth: { token },
  reconnectionAttempts: 2,
});

socket.on('connect', () => {
  console.log('✅ Connected successfully! Socket ID:', socket.id);
  
  // Test joining room
  socket.emit('webrtc:join-room', { roomId: 'test-room' }, (res) => {
    console.log('Join room response:', res);
    socket.disconnect();
    process.exit(0);
  });
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('❌ Connection timeout');
  process.exit(1);
}, 15000);
