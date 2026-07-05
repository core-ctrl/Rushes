import http from 'http';
import fs from 'fs';

http.get('http://localhost:3000/api/debug-lists', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('debug.json', data);
    console.log('done');
  });
}).on('error', (err) => {
  console.error(err);
});
