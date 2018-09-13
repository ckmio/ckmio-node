import CkmioClient from "./ckmio-client";

let publisher = new CkmioClient({planKey : "community-test-key", planSecret : "community-test-secret", user : "Producer"});

let subscriber = new CkmioClient({planKey : "community-test-key", planSecret : "community-test-secret", user : "Subscriber"});
subscriber.subscribeToTopic("A brand new Topic",
	(response)=> {
		console.log(`Subscriber received a message with content \n ${JSON.stringify(response.payload)}\n`);
});



setTimeout(()=> {
	publisher.createTopic("A brand new Topic");
	publisher.sendTopicUpdate("A brand new Topic", {name : "Bob Marley", age : 35});
	publisher.sendTopicUpdate("A brand new Topic", {name : "Mamadou", age : 56});
	}, 5000);