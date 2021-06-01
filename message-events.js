//	message-events - (pre)formatted message events
//
// MIT License
//
// Copyright (c) 2021 Dennis Raymondo van der Sluis
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//

const { isFunction, isString, forceArray, forceFunction } = require( 'types.js' );


const APP_VERSION			= '0.3.3';
const ERROR 				= 'error';
const FORMAT 				= 'format';
const INFO 					= 'info';
const MAX_ID_LENGTH			= 48;
const MESSAGE_EVENTS 		= 'MessageEvents';
const OFF 					= 'off';
const ON 					= 'on';
const INTERNAL_METHOD_IDS	= [ 'constructor', OFF, ON, FORMAT ];

let message = undefined;



//
// error handling and messages
//
const ERROR_INVALID_ARGUMENTS	= 'invalid or missing argument(s)!';
const ERROR_INVALID_HANDLER		= 'invalid or missing handler!';
const ERROR_INTERNAL_ID			= 'internal method names are not allowed!';
const ERROR_INVALID_ID_LENGTH	= 'invalid id length!';


const argumentIsString = ( arg, callerId ) => {
	if ( isString(arg) ){
		return true;
	}
	message.error( callerId, ERROR_INVALID_ARGUMENTS );
};

const validIdLength = ( id, callerId ) => {
	if ( (id.length > 0) && (id.length <= MAX_ID_LENGTH) ){
		return true;
	}
	message.error( callerId, ERROR_INVALID_ID_LENGTH );
};

const noInternalId = ( id, callerId ) => {
	if ( INTERNAL_METHOD_IDS.indexOf(id) < 0 ){
		return true;
	}
	message.error( callerId, ERROR_INTERNAL_ID );
};

const validId = ( id, callerId ) => {
	if (
		argumentIsString( id, callerId ) &&
		validIdLength( id, callerId ) &&
		noInternalId( id, callerId )
	) return true;
};

const validHandler = ( handler, callerId ) => {
	if ( isFunction(handler) ){
		return true;
	}
	message.error( callerId, ERROR_INVALID_HANDLER );
};

const showInfoMessage = () => {
	message.info({
		sender: MESSAGE_EVENTS,
		type: INFO,
		loaded: true,
		version: APP_VERSION,
	});
};
//
//



class MessageEvents {

	//
	// static
	//
	static get ERROR_INVALID_HANDLER(){ return ERROR_INVALID_HANDLER };
	static get ERROR_INVALID_ARGUMENTS(){ return ERROR_INVALID_ARGUMENTS };
	static get ERROR_INTERNAL_ID(){ return ERROR_INTERNAL_ID };
	static get ERROR_INVALID_ID_LENGTH(){ return ERROR_INVALID_ID_LENGTH };

	static on = ( id, handler ) => {
		message.on( id, handler );
		if ( id == INFO ) showInfoMessage();
	};

	static off = ( id ) => message.off( id );
	//
	//


	//
	// instance
	//
	#formats = {};


	format( id, handler ){
		if ( validId(id, FORMAT) && validHandler(handler, FORMAT) ){
			this.#formats[id] = handler;
			// this is to allow for installing the format handler after the .on handler
			if ( this.hasOwnProperty(id) ){
				// make copy to prevent an infinite loop on call
				const func = this[ id ];
				this[id] = (...data) => func( this.#formats[id]( ...forceArray(data) ) );
			} else {
				// install a dummy method so it can already be called ahead of installing the final handler with .on
				this[ id ] = forceFunction();
			}
		}

		return this;
	}

	// .off only removes the handler, not the format, so when you re-apply a new handler the format is still in place
	off( id ){
		 if ( id == undefined ){
			for ( const handlerId in this ){
				this[ handlerId ] = forceFunction();
			}
		} else if ( this.hasOwnProperty(id) && noInternalId(id, OFF) ){
			this[ id ] = forceFunction();
		}

		return this;
	}

	on( id, handler ){
		if ( validId(id, ON) && validHandler(handler, ON) ){
			if ( this.#formats[id] ){
				// using forceArray to make sure we can always destruct the arguments
				this[id] = (...data) => handler( this.#formats[id](...forceArray( data )) );
			} else this[id] = handler;
		}

		return this;
	}
	//
	//
}


message = new MessageEvents()
	.format( INFO, (data) => data )
	.format( ERROR, (method, ...text) => {
		return {
			sender	: MESSAGE_EVENTS,
			method,
			type 	: ERROR,
			text	: text.join(' '),
		};
	});


module.exports = MessageEvents;
