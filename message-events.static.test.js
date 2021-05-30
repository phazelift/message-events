const { typeOf }	= require( 'types.js' );
const MessageEvents	= require( './message-events.js' );


const {
	ERROR_INVALID_ARGUMENTS,
	ERROR_INVALID_HANDLER,	
	ERROR_INTERNAL_ID,
	ERROR_INVALID_ID_LENGTH,	
} = MessageEvents;


let result		= {};
const fillResult = (data) => result = data;

let consoleData = "";
const storeLog = ( ...inputs ) => (consoleData = inputs.join(' ') );
console[ "error" ] = jest.fn( storeLog );


beforeEach(() => {
	// MessageEvents.off( 'error' );
	message = new MessageEvents;
	result = {};
});


MessageEvents.on( 'error', fillResult  );



test( 'test MessageEvents.on info returns info object', () => {
	MessageEvents.on( 'info', fillResult  );
	expect( result.sender ).toBe( 'MessageEvents' );
	expect( result.loaded ).toBe( true );
	expect( result.type ).toBe( 'info' );
	expect( typeOf(result.version) ).toBe( 'string' );
});
	

test( 'test MessageEvents.on input/arguments: no error on empty on call', () => {
	MessageEvents.on( 'error', fillResult  );
	expect( result ).toEqual( {} );
	expect( consoleData ).toBe( '' );
});
	
test( 'test MessageEvents.on input/arguments robustness - no arguments', () => {
	MessageEvents.on();
	expect( result ).toEqual({
		method	: 'on',
		sender	: 'MessageEvents',
		text	: ERROR_INVALID_ARGUMENTS,
		type	: 'error',
	});
	expect( consoleData ).toBe( '' );
});


test( 'test MessageEvents.on input/arguments robustness - missing handler', () => {
	MessageEvents.on( 'error' );
	expect( result ).toEqual({
		method	: 'on',
		sender	: 'MessageEvents',
		text	: ERROR_INVALID_HANDLER,
		type	: 'error',
	});
	expect( consoleData ).toBe( '' );
});


test( 'test MessageEvents.on input/arguments robustness - invalid handler', () => {
	MessageEvents.on( 'error', 'must be a function' );
	expect( result ).toEqual({
		method	: 'on',
		sender	: 'MessageEvents',
		text	: ERROR_INVALID_HANDLER,
		type	: 'error',
	});
	expect( consoleData ).toBe( '' );
});


test( 'test MessageEvents.on error messages', () => {	
	const me = new MessageEvents();
	expect( consoleData ).toBe( '' );

	me.on();
	expect( result ).toEqual({
		method	: 'on',
		sender	: 'MessageEvents',
		text	: ERROR_INVALID_ARGUMENTS,
		type	: 'error',
    });

	me.on();
	expect( result ).toEqual({
		method	: 'on',
		sender	: 'MessageEvents',
		text	: ERROR_INVALID_ARGUMENTS,
		type	: 'error',
    });

	me.on( '' );
	expect( result ).toEqual({
		method	: 'on',
		sender	: 'MessageEvents',
		text	: ERROR_INVALID_ID_LENGTH,
		type	: 'error',
    });

	me.on( 'on' );
	expect( result ).toEqual({
		method	: 'on',
		sender	: 'MessageEvents',
		text	: ERROR_INTERNAL_ID,
		type	: 'error',
    });

	me.on( 'off' );
	expect( result ).toEqual({
		method	: 'on',
		sender	: 'MessageEvents',
		text	: ERROR_INTERNAL_ID,
		type	: 'error',
    });

	me.on( 'constructor' );
	expect( result ).toEqual({
		method	: 'on',
		sender	: 'MessageEvents',
		text	: ERROR_INTERNAL_ID,
		type	: 'error',
    });

	me.on( 'format' );
	expect( result ).toEqual({
		method	: 'on',
		sender	: 'MessageEvents',
		text	: ERROR_INTERNAL_ID,
		type	: 'error',
    });

});


test( 'test MessageEvents.on handler working as expected', () => {	
	const me = new MessageEvents();
	let DATA = { a: 1 };
	me.on( 'info', fillResult );
	me.info( DATA );
	expect( result ).toEqual( DATA );

	DATA = {
		type: 'info',
		text: 'a custom format, directly with .on',
	};
	me.on( 'info', (more) => result = { ...DATA, ...more } );
	me.info({ signed: true} );
	expect( result ).toEqual( {...DATA, signed: true} );
});


test( 'test MessageEvents.off handler working as expected', () => {	
	const me = new MessageEvents();
	const DATA = { a: 1 };
	me.on( 'info', fillResult );
	me.off( 'info' );
	me.info( 'bla bla bla' );
	expect( result ).toEqual( {} );

	me.on( 'info', fillResult );
	me.on( 'error', fillResult );
	me.off();
	me.info( 'bla bla bla' );
	expect( result ).toEqual( {} );
	me.error( 'bla bla bla' );
	expect( result ).toEqual( {} );
});


test( 'test MessageEvents .format and .on handler declaration order should not matter', () => {	
	const me = new MessageEvents();
	me.on( 'info', fillResult );
	me.info( 'on came first' );
	expect( result ).toBe( 'on came first' );

	me.format( 'info', (text) => {
		return { text };
	});
	me.info( 'format came second' );
	expect( result ).toEqual( { text: 'format came second' } );

	me.info( 'on again' );
	expect( result ).toEqual( { text: 'on again' } );

	// there is no need for a method to remove or reset the format handler, so we test it manually
	me.format( 'info', (text) => text );
	me.info( 'format reset' );
	expect( result ).toBe( 'format reset' );
});
