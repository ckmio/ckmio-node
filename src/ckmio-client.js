import { Socket } from 'net';
import { Buffer } from 'buffer';


export var services = {
    auth : "10",
    chat : "22",
    topic : "21",
    funnel: "27"
};

export var actions = {
    add : "add",
    send_chat_message: "send-chat-message",
    notify :"notify",
	subscribe : "subscribe",
	unsubscribe : "unsubscribe"
}


function client_ref(){
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
  });
}

function getHandler(client, type){
    switch(type){
        case(services.auth):
            return client.options.authenticationHandler;
        case(services.topic):
            return client.options.topicHandler;
        case(services.funnel):
            return client.options.funnelHandler;
        case(services.chat):
            return client.options.chatHandler;
        default:
            return null;

    }
}

function amleneResponseHandler(response, client){
    let handler = client.subscriptions[response.clt_ref] || getHandler(response.type);
    if(handler)
        handler(response, client);
    else
        console.log(`No suitable handler found for this response : ${JSON.stringify(response)}`);
}

export default class CkmioClient {
    constructor(options) {
        this.host = "dev.ckmio.com";
        this.port = 7023;
        this.options = options;
        this.connection = new Socket();
        this.connecting = false;
        this.subscriptions = {};
        this.delay = 500;
        this.handlers = {
            'data': this.receiveAndDecodeMessage.bind(this),
            'connect': this.onConnection(),
        };
        this.remainding = null;
        this.remaindingLength = 0;
        this.init(this);
    }

    /* start chat handlers */
    subscribeToChat(handler){
      this.throttle(()=>this.doSubscribe(services.chat, {}, handler));
    }

    sendChatMessage(to, content){
      var ref = client_ref();
      this.throttle(()=> 
        this.formatAndSendMessage(this.connection, 
            services.chat, 
            {clt_ref: ref, action: actions.send_chat_message, payload : {from : this.options.user, to : to, content : content }})
        );
    }
    /* end chat handlers */

    /* topic handlers */
    createTopic(name){
      var ref = client_ref();
      this.throttle(()=> this.formatAndSendMessage(this.connection, 
            services.topic, 
            {clt_ref: ref, action: actions.add, payload : {name : name, description : "Just for us!"}})
        );
    }

    subscribeToTopic(name, handler){
        this.throttle(()=>this.doSubscribe(services.topic, {name:name}, handler));
    }

    sendTopicUpdate(name, updateMessage){
        var ref = client_ref();
        this.throttle(()=> this.formatAndSendMessage(this.connection, 
              services.topic, 
              {clt_ref: ref, action: actions.notify, payload : {name : name, content : updateMessage}})
          );
    }

    login(user, password, planKey, planSecret){
    	console.log(`I am logging in ${user} - ${password} `)
        this.formatAndSendMessage(this.connection, services.auth, {action : "authenticate", clt_ref: client_ref(), payload: { user: user||"",  password:password||"", plan_key : planKey, plan_secret :planSecret} });
    }

    /* funnels */

    sendToStream(name, data){
        this.throttle(()=> this.formatAndSendMessage(this.connection, services.funnel, {clt_ref: client_ref(), action: actions.add, payload : { stream : name, content: data}}));
    }

    createStream(name){
        this.throttle(()=> this.formatAndSendMessage(this.connection, 
            services.funnel, 
            {clt_ref: client_ref(), action: actions.add, payload : {stream : name}})
        );
    }

    funnel(name, when, callback){
        this.throttle(()=>this.doSubscribe(services.funnel, {stream:name, when: when}, callback));
    }

    

    doSubscribe(service, data, callback){
        let ref = client_ref();
        if(callback) this.subscriptions[ref] = callback;
        this.formatAndSendMessage(this.connection, service, { action : actions.subscribe, payload : data, clt_ref: ref });
        return ref;
    }

    unsubscribe(service, ref){
        var subscription = this.subscriptions[ref];
        if(subscription!=null)
            delete subscriptions[ref];
        this.formatAndSendMessage(this.connection, service, {  action : actions.unsubscribe, clt_ref: ref }); 
    }

    on(subscription, callback){
        this.throttle(()=>this.subscribe(subscription.conditions, callback));
    }


    waitThenInit(milliseconds, eventname, $this) {
        return ((e) => {
            console.log(e); console.log(eventname); $this.connected = false; $this.connecting = true;
            setTimeout(() => $this.init($this), milliseconds);
        });
    }

    onConnection() {
        var $this = this;
        return () => { 
            console.log('I am connected \n');
            $this.connected = true; $this.connecting = false;
            $this.login($this.options.user, $this.options.password, $this.options.planKey, $this.options.planSecret); 
        }
    }

    init(self) {
        var $this = (self == undefined) ? this : self;

        if ($this.connected)
            return;


        if ($this.connecting != true && $this.connection.connecting != true) {
            if($this.debug){
            console.log('this.connecting ' + $this.connecting);
            console.log('this.connection.connecting ' + $this.connection.connecting);
            }

            var $waitThenInitEnd = $this.waitThenInit(5000, "end", $this);
            var $waitThenInitError = $this.waitThenInit(5000, "error", $this);
            $this.connectiong = true;
            $this.connection.on('data', $this.handlers['data']);
            $this.connection.on('end', $waitThenInitEnd);
            $this.connection.on('error', $waitThenInitError);
            $this.connection.on('connect', $this.handlers['connect']);
        }

        if (!$this.connection.connecting) {
            $this.connection.connect($this.port, $this.host);
            $this.connecting = true;
        }
    }

    __handleResponse(str){
        var r = JSON.parse(str); 
        amleneResponseHandler(r, this);
    }

    throttle(action){
      setTimeout(action, this.delay);
    }

    formatAndSendMessage(connection, service, payload) {
        var message = service + ":" + JSON.stringify(payload);
        var dataPacket = Buffer.from(message);
        var packetLength = dataPacket.length;
        var arr = new Uint8Array([
            (packetLength & 0xff000000) >> 24,
            (packetLength & 0x00ff0000) >> 16,
            (packetLength & 0x0000ff00) >> 8,
            (packetLength & 0x000000ff)
        ]);
        connection.write(Buffer.from(arr.buffer)); // writing the size of the packet
        connection.write(dataPacket);              // writing the actual packet 
    }

    receiveAndDecodeMessage(data){
        var totalMessageLength = Buffer.byteLength(data);
        if(this.debug) console.log("Total Message Length " + totalMessageLength);
        var accumulatedLen = 0;
        if(this.remainding!=null)
        {
            var missingData = new Buffer(data.buffer.slice(data.byteOffset, data.byteOffset + this.remaindingLength));
            var slicedMessage = Buffer.concat([this.remainding, missingData]);
            this.__handleResponse(slicedMessage.toString("utf8"));
            accumulatedLen = this.remaindingLength;
        }
        while(totalMessageLength - accumulatedLen > 0){
            var nextMessageLength = Buffer.from(data.buffer, accumulatedLen, 4).readUInt32BE();
            if(totalMessageLength - accumulatedLen -nextMessageLength -4 < 0)
            {
                this.remainding = new Buffer(data.buffer.slice(data.byteOffset + 4 + accumulatedLen, data.byteOffset + totalMessageLength));
                this.remaindingLength = -(totalMessageLength - accumulatedLen -nextMessageLength -4);
                return;
            }      
            if(this.debug) console.log("Next Message Length " + nextMessageLength);
            var slicedMessage = new Buffer(data.buffer.slice(data.byteOffset + 4 + accumulatedLen, data.byteOffset + 4 + accumulatedLen + nextMessageLength));
            this.__handleResponse(slicedMessage.toString("utf8"));
            accumulatedLen += nextMessageLength + 4;
        }
        this.remainding = null;     
    }

}

