import fs from 'fs';
import { ms } from './ms.js'
import { bytes } from './bytes.js'

let logLineBuffer = [];
const DEFAULT_LOGPATH            = 'http.log'
const DEFAULT_LOG_WRITE_INTERVAL = '1s'
const DEFAULT_MAX_LOGFILE_SIZE   = '1mb'
const DEFAULT_MAX_FILES          = 7
const DEFAULT_ROTATION_FREQUENCY = '1h'

import { Worker, isMainThread, parentPort } from 'worker_threads';

let intervalId


let config = {}

/*
function logRotate(file, maxSize) {
  try {
    const stat = fs.statSync(file);
    if (stat.size > maxSize) {
      fs.renameSync(file, file.replace(/log$/, 'old.log'));
    }
  } catch (e) {
    // error
  }
}
*/



function logTick() {

  if (logLineBuffer.length > 0) {
    const data = logLineBuffer.join('\n') + '\n';
    
    fs.appendFile( config.fileName, data, err => {
      if (err) console.error(`Error writing to log file ${config.fileName}:`, err);
    });
    
    logLineBuffer.length = 0; 
  }

}



function log( req, resp ) {
  const logline = `r ${(req.httplog.start/1000).toFixed(3)} ${req.method} ${resp.status} HTTP/${req._nodeRequest.httpVersion} ${req.host} ${req.url}`
  logLineBuffer.push( logline )
}


function assertType(name, option, expectedType) {

  let type = Array.isArray(expectedType) ? expectedType : [ expectedType ];

  if (option && !type.includes(typeof option)) {
		throw new Error(`${name} must be type ${type}. Received: ${typeof option}`);
	}
}

function resolveConfig(options) {

	assertType('fileName', options.fileName, 'string');
  assertType('maxSize', options.maxSize,   [ 'string', 'number' ] );
	assertType('maxFiles', options.maxFile,  'number');
  assertType('rotationFrequency', options.rotationFrequency, [ 'string', 'number' ] );
  assertType('logWriteInterval', options.logWriteInterval, [ 'string', 'number' ] );

	const config = {
    fileName: options.fileName || DEFAULT_LOGPATH,
    maxSize: bytes(options.maxSize || DEFAULT_MAX_LOGFILE_SIZE ),
    maxFiles: options.maxFiles || DEFAULT_MAX_FILES,
    rotationFrequency: ms(options.rotationFrequency || DEFAULT_LOG_WRITE_INTERVAL ),
    logWriteInterval: ms(options.logWriteInterval || DEFAULT_LOG_WRITE_INTERVAL )
  }

	logger.debug('httplog:\n' + JSON.stringify(config, undefined, 2));

	return config;
}



export async function startOnMainThread(options = {}) {


  try {
    config = resolveConfig(options);
  }
  catch ( error ) {
    console.log( "Config parse failed for httplog" )
    console.log( error )
  }

}


async function sendLogFileEvents( req ) {
  let buffer = '';
  let position = 0;
  let fileDescriptor = null;
        
  await req._nodeRequest.client.write( "HTTP/1.1 200 OK\r\n" );
  await req._nodeRequest.client.write( "Content-type: text/event-stream\r\n" );
  await req._nodeRequest.client.write( "\r\n" );


  let oldSize = 0
        
  fs.open(config.fileName, 'r', (err, fd) => {
    if (err) {
      console.error(`Failed to open file: ${err.message}`);
      return;
    }
    fileDescriptor = fd;

    // Get the initial position (end of file)
    fs.fstat(fd, (err, stats) => {
      if (err) return;
      position = stats.size;

      // Start watching
      fs.watch(config.fileName, (eventType) => {
        if (eventType === 'change') {
          readNewLines(   );
        }
      });
    });
  });

  function readNewLines() {
    fs.fstat(fileDescriptor, (err, stats) => {
      if (err) return;
      const newSize = stats.size;
      const bytesToRead = newSize - position;

      if (bytesToRead <= 0) return;

      const readBuffer = Buffer.alloc(bytesToRead);
      fs.read(fileDescriptor, readBuffer, 0, bytesToRead, position, (err, bytesRead, bufferChunk) => {
        if (err) return;

        position += bytesRead;
        buffer += bufferChunk.toString('utf8');
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        lines.forEach( line => {
          console.log( `data: ${line}` )
          req._nodeRequest.client.write( `data: ${line}\r\n\r\n` );
        })

      });
    });
  }

}

export async function start( options = {} ) {

  // This should really happen on the main thhread and then be
  // passed to the children
  try {
    config = resolveConfig(options);
  }
  catch ( error ) {
    console.log( "Config parse failed for httplog" )
    console.log( error )
  }


  intervalId = setInterval( logTick, config.logWriteInterval );

  server.http(
		async (req, next) => {

      if ( req.url === '/taillog' ) {
        await sendLogFileEvents( req );
        return null
      }

      
      req.httplog = {
        start: Date.now(),
      }

      const resp = await next(req)

      log( req, resp )

      return resp
		}, { runFirst: true }
	);
  
}


