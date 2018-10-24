import CkmioClient from "./ckmio-client";

let producer = new CkmioClient({planKey : "community-test-key", planSecret : "community-test-secret", user : "Producer"});

let consumer1 = new CkmioClient({planKey : "community-test-key", planSecret : "community-test-secret", user : "Consumer1"});
consumer1.funnel("A brand new Stream", [{field: "name", op: "contains", value :"Bob"}],
	(response)=> {
		console.log(`Consumer1 received a message with content \n ${JSON.stringify(response.payload.content)}\n`);
});

let consumer2 = new CkmioClient({planKey : "community-test-key", planSecret : "community-test-secret", user : "Consumer1"});
consumer2.funnel("A brand new Stream", [{field: "age", op: "greater_than", value: 40}],
	(response)=> {
		console.log(`Consumer2 received a message with content \n ${JSON.stringify(response.payload.content)}\n`);
});

setTimeout(()=> {
	producer.createStream("A brand new Stream");
	producer.sendToStream("A brand new Stream", {name : "Bob Marley", age : 35});
	producer.sendToStream("A brand new Stream", {name : "Mamadou", age : 56});
	}, 5000);