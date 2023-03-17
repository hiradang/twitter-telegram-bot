require("dotenv/config");
const { Telegraf } = require("telegraf");
const { TwitterApi, ETwitterStreamEvent } = require("twitter-api-v2");
const {
	TwitterApiRateLimitPlugin,
} = require("@twitter-api-v2/plugin-rate-limit");

const rateLimitPlugin = new TwitterApiRateLimitPlugin();
const client = new TwitterApi(process.env.BEARER_TOKEN, {
	plugins: [rateLimitPlugin],
});

const bot = new Telegraf(process.env.BOT_TOKEN);
// exports.handler = async (event) => {
async function main() {
	// ...make requests...
	// await client.v2.me();
	const currentRateLimitForMe = await rateLimitPlugin.v2.getRateLimit(
		"users/me"
	);
	console.log("Rate Limit:", currentRateLimitForMe);
	console.log("Rate Limite Reamaining: ", currentRateLimitForMe);

	// Create a new Twitter client
	const addedRules = await client.v2.updateStreamRules({
		add: [{ value: "#Blockchain -is:retweet -is:reply -is:quote", tag: "BL" }],
	});

	const stream = await client.v2.searchStream();

	// // Delete rules
	// const deleteRules = await client.v2.updateStreamRules({
	// 	delete: {
	// 		ids: ["1636624576003342337"],
	// 	},
	// });

	// // Show Rules
	// const rules = await client.v2.streamRules();
	// // Log every rule ID
	// console.log(rules);

	stream.on(ETwitterStreamEvent.Data, async (tweet) => {
		// const message = `New tweet from ${tweet.user.name}: ${tweet.text}`;
		console.log(tweet);
		try {
			await bot.telegram.sendMessage(
				process.env.CHAT_ID,
				`${tweet.data.text} \n Link: https://twitter.com/i/web/status/${tweet.data.id}`
			);
		} catch (error) {
			if (
				error instanceof ApiResponseError &&
				error.rateLimitError &&
				error.rateLimit
			) {
				console.log(
					`You just hit the rate limit! Limit for this endpoint is ${error.rateLimit.limit} requests!`
				);
				console.log(
					`Request counter will reset at timestamp ${error.rateLimit.reset}.`
				);
			} else console.error(error);
		}
		stream.close();
	});

	stream.on(
		// Emitted when Node.js {response} emits a 'error' event (contains its payload).
		ETwitterStreamEvent.ConnectionError,
		(err) => console.log("Connection error!", err)
	);

	stream.on(
		// Emitted when Node.js {response} is closed by remote or using .close().
		ETwitterStreamEvent.ConnectionClosed,
		() => console.log("Connection has been closed.")
	);

	stream.on(
		// Emitted when a Twitter payload (a tweet or not, given the endpoint).
		ETwitterStreamEvent.Data,
		(eventData) => console.log("Twitter has sent something:", eventData)
	);

	stream.on(
		// Emitted when a Twitter sent a signal to maintain connection active
		ETwitterStreamEvent.DataKeepAlive,
		() => console.log("Twitter has a keep-alive packet.")
	);
}
main();
