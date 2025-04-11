import fs from 'fs/promises';


console.log( "Loading" )


async function sendLogFileEvents( out, filename ) {

  let buffer = ''

  // Loop forever
  while( 1 ) {

    let fd
    
    try {
      fd = await fs.open( filename, 'r' )
    }
    catch {
      await out.send( "Log file missing. Try again" )
      return
    }
    
    try {
      
      let stats = await fd.stat();
      let pos = stats.size
    
      for await ( const changes of await fs.watch( filename ) ) {

        const stats = await fd.stat();

        const bytesToRead = stats.size - pos

        if ( bytesToRead > 0 ) {
          const readBuffer = Buffer.alloc(bytesToRead);
          const r = await fd.read( readBuffer, 0, bytesToRead, pos )

          pos += readBuffer.length
          buffer += readBuffer.toString('utf8');
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete line
          
          for ( const line of lines ) {
            const r = await out.send( line );
          }
        }

        if ( changes.eventType === 'rename' ) {
          await fd.close()
          break
        }
      }

      console.log( "Exiting watch" )


    }
    catch( error ) {
      console.log( error )
      return null
    }
  }
}


export class taillog extends Resource {

  connect() { // note that this can handle both SSE *and* WS

    const context = this.getContext()

    if ( !context.httplog.config.tail ) {
      return { status: 405, headers: {} }
    }
    
    let outgoingMessages = super.connect();

		outgoingMessages.on('close', () => {
      console.log( "Socket closed" )
		});

    sendLogFileEvents( outgoingMessages, context.httplog?.config?.fileName ) 
    
    return outgoingMessages
  }
}

export class error extends Resource {
  get(query) {
    iauhiuh
  }
  
}
