import 'module-alias/register';
import app from '~/app';
import http from 'http';
import debug from "debug";

import dotenv from 'dotenv';
dotenv.config();

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
function normalizePort(val: any) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error: any) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  const addr: any = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
  console.warn('Listening port:', addr.port)
}

const server = http.createServer(app);

server.on('error', onError);
server.on('listening', onListening);
server.listen(port);
