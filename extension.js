import fs from 'fs/promises';
import { ms } from './ms.js'
import { bytes } from './bytes.js'
import path from 'path';
import { threadId as threadID } from 'worker_threads';

const DEFAULT_LOGPATH            = 'http.log'
const DEFAULT_LOG_WRITE_INTERVAL = '1s'
const DEFAULT_MAX_LOGFILE_SIZE   = '1mb'
const DEFAULT_MAX_FILES          = 7
const DEFAULT_ROTATION_FREQUENCY = '1h'
const DEFAULT_LOG_TAILING        = false

let logLineBuffer = [];
let requestID = 1
let intervalId
let config = {}


class LogLine {
  constructor( options = { id: null, config: null } ) {
    this.start = Date.now()
    this.id = options.id
    this.config = options.config
    this.custom = []
  }

  addCustomField( value, n = 1 ) {
    if ( n > 1 ) {
      throw( "Trying to log too many custom fields" )
    }
    if ( n < 1 ) {
      throw( "Trying to log a custom field with too small an index" )
    }

    this.custom[n-1] = value;
  }
}

function timestamp( date ) {
  
  const yyyy = date.getFullYear();
  let mm = date.getMonth() + 1; // Months start at 0!
  let dd = date.getDate();
  let h = date.getHours()
  let m = date.getMinutes()
  let s = date.getSeconds()
  
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  if (h < 10) h = '0' + h;
  if (m < 10) m = '0' + m;
  if (s < 10) s = '0' + s;

  return yyyy + mm + dd + "_" + h + m + s;
}

function rotatedFilename( filename ) {
  
  const ext  = path.extname( filename )
  const name = path.basename( filename, ext )
  const base = path.dirname( filename )
  const ts   = timestamp( new Date() )

  return base + '/' + name + '-' + ts + ext;
}

async function listLogFiles( filename ) {

  const ext  = path.extname( filename )
  const name = path.basename( filename, ext )
  const base = path.dirname( filename )

  const dirContents = await fs.readdir( base );

  const files = []
  const regex = new RegExp( `${name}-(\\d{8})_(\\d{6})${ext}` )

  dirContents.forEach( file => {
    const match = file.match( regex );
    if ( match ) {
      const stamp = parseInt(match[1] + match[2]);
      files.push( [ stamp, `${base}/${file}` ] )
    }
  })

  
  return files.sort( (a, b) => a[0] - b[0] )
  
}


async function logRotate(file, maxSize) {
  try {
    const stat = await fs.stat( file );
    if (stat.size > maxSize) {

      const newFilename = rotatedFilename( file )
      await fs.rename(file, newFilename );

      const logFiles = await listLogFiles( file )

      while( logFiles.length > config.maxFiles ) {
        const file = logFiles.shift()
        await fs.rm( file[1] );
      }

      const fd = await fs.open( file, 'w' );
      await fd.close()
      
    }
  }
  catch (e) {
    console.log( e )
  }
}

async function logTick() {

  if (logLineBuffer.length > 0) {
    const data = logLineBuffer.join('\n') + '\n';

    await fs.appendFile( config.fileName, data )

    //    await logRotate( config.fileName, config.maxSize )
    
    
    logLineBuffer.length = 0; 
  }

}





function log( req, resp ) {
  // coerce undefined/null to -2
  let status = resp?.status ?? -2;
  if (status < 100) {
    if (status === -1) status = 404;
    else if (status === -2 && req.isWebSocket) status = 101;
  }

  const custom = req.httplog.custom[0] ?? '-'

  const fields = [
    'r',
    (req.httplog.start/1000).toFixed(3),
    req.httplog.id,
    req.httplog.clientAddress,
    req.method,
    status,
    `HTTP/${req._nodeRequest.httpVersion}`,
    req.host,
    req.url,
    custom
  ]
  
  const logline = fields.join( ' ' )
  
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
  assertType('tail', options.tail, 'boolean' );
  
	const config = {
    fileName:          options.fileName             || DEFAULT_LOGPATH,
    maxSize:           bytes(options.maxSize        || DEFAULT_MAX_LOGFILE_SIZE ),
    maxFiles:          options.maxFiles             || DEFAULT_MAX_FILES,
    rotationFrequency: ms(options.rotationFrequency || DEFAULT_LOG_WRITE_INTERVAL ),
    logWriteInterval:  ms(options.logWriteInterval  || DEFAULT_LOG_WRITE_INTERVAL ),
    tail:              options.tail                 || DEFAULT_LOG_TAILING
  }

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

      req.httplog = new LogLine( { id: `${requestID}.${threadID}`, config } )

      req.httplog.clientAddress = req._nodeRequest.socket.remoteAddress
      
      
      requestID++
      
      const resp = await next(req)

      log( req, resp )

      return resp
		}, { runFirst: true }
	);
  
}


