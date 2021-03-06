# message-events

<br/>

## (pre)formatted message events for improved logging

<br/>


It would be great if more developers would silently emit message objects from their libraries instead of spamming logs in the console. Maybe the developer of the consuming app wants to send it to a server, store it in a database or take any other action based upon the specifics of a message. Many things are possible, and there is no need to not let the user of your lib decide what to do with your libs messages.

MessageEvents is an attempt to replace console statements in libraries with a generic and much more powerful system of showing errors and sending out data from your lib. Although there are many great event and log libraries out there, none are as lean and specific as I wished for. MessageEvents main differences compared to some popular event and logging libraries are:

	- you can format and send messages before a .on handler is installed
	- it is non-opinionated and extremely lightweight
	- pretty robust and well tested
	- sends out message objects itself

<br/>

Here are some basic examples of how to use it
```javascript
// my-lib.js
const MessageEvents = require( 'message-events' );

// totally minimalistic working example
let message = new MessageEvents;
message.on( 'error', console.error );
message.error( 'arguments', 'to', 'console.error' );
// arguments to console.error


// a bit more elaborate
// with the format method you can format every message you emit into the format of your liking
message.format( 'error', (method, ...text) => {
	return {
		sender: 'my-lib.js',
		type: 'error',
		method,
		text: text.join(' '),
		// appVersion: APP_VERSION,
		// userId: '...',
		// etc..
	};
});

// you can now write error messages where needed,
// but they are to be seen/received only after a .on handler is installed
message.error( 'idOfMethod', 'enter', 'the', 'void!' );

// add more types of messages when needed
message.format( 'info', (...text) => {
	return {
		sender: 'my-lib.js',
		type: 'info',
		text: text.join(' '),
	};
});
// now you can do
message.info( 'this info can go to another user defined handler' );


// make your messages available for users of your lib
class MyLib{}
// allow a user to add a handler for the messages
MyLib.on = (type: string, handler: Function) => message.on(type, handler);
module.exports = MyLib
// end of module



// in your users file
const lib = require( 'your-lib' );

// for development your user could install a handler to direct your libs messages to the console,
// while in production they can send these same errors instead to a server for monitoring
if ( process.env.NODE_ENV === 'production' ){
	lib.on( 'error', (data) => {
		axios.post( 'solib.api.domain/error-messages', data );
	});
} else lib.on( 'error', console.error );


// when you only need one quick message type, you can call .format directly via the constructor
message = new MessageEvents( 'error', (...text) => {
	return {
		sender: 'myModule',
		type: 'error',
		text	: text.join(' '),
	};
});
```
<br/>

In a large app it might be a good idea to make the MessageEvents instance(s) "public" by putting them in a separate module:

```javascript
// instance/message-events.js

const MessageEvents = require( 'message-events' );

const message = new MessageEvents;

if ( process.env.NODE_ENV !== 'production' ){
	// handle error messages coming from MessageEvents itself during development
	MessageEvents.on( 'error', console.error );
	// define output for development
	message.on( 'log', console.log );
	message.on( 'info', console.log );
	message.on( 'error', console.error );
}

// you could define a generic format for your messages
const formatMessage = (type, module, args) => {
	return {
		sender: 'my-lib.js',
		module,
		type,
		text: args,
	}
};

message.format( 'info', (module, text) => formatMessage('info', module, text) );
message.format( 'error', (module, text) => formatMessage('error', module, text) );
// etc..


// and then use it in some-module.js
const { message } = require( '@instance/message-events.js' );

message.log( 'no formatting was defined for message.log' );
message.info( 'some-module.js:', 'hello message-events!' );
message.error( 'some-module.js:', 'your error message here' );
// in development mode these three lines should output:
//
// no formatting was defined for message.log
// {
//   sender: 'my-lib.js',
//   module: 'some-module.js:',
//   type: 'info',
//   text: 'hello message-events!'
// }
// {
//   sender: 'my-lib.js',
//   module: 'some-module.js:',
//   type: 'error',
//   text: 'your error message here'
// }
```

<br/>

# api
MessageEvents emits it's own messages from an instance of itself. There are 2 types: 'info' and 'error'. Use MessageEvents.on to install a handler that listens to them.
```typescript
MessageEvents.on( id: string, handler: function ) : void;
MessageEvents.off( id: string || void ) : void;	// void/undefined removes all handlers

// methods:
	.format( id: string, handler: function ) : this;
	.off( id: string || void ) : this;			// void/undefined removes all handlers
	.on( id: string, handler: function ) : this;
```
