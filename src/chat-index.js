import CkmioClient from "./ckmio-client";

let tahibou = new CkmioClient({planKey : "community-test-key", planSecret : "community-test-secret", user : "Tahibou"});
tahibou.subscribeToChat((message)=> {
	console.log(`Mamadou received a message from ${message.from} \n ${message.content}`);
});


let mamadou = new CkmioClient({planKey : "community-test-key", planSecret : "community-test-secret", user : "Mamadou"});
mamadou.subscribeToChat((message)=> {
	console.log(`Mamadou received a message from ${message.payload.from} \n ${message.payload.content}`);
});

setTimeout(()=> {
	for(var i=0; i<12; i++){
		mamadou.sendChatMessage("Tahibou", "Hey guys, we love you! "+i);
		tahibou.sendChatMessage("Mamadou", "Hey guys, we love you! "+i);
	}
}, 5000);