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
	// // await client.v2.me();

	//Rate Limit is not supported for App Context Only Account
	// const currentRateLimitForMe = await rateLimitPlugin.v2.getRateLimit(
	// 	"users/me"
	// );
	// console.log("Rate Limit:", currentRateLimitForMe);
	// console.log("Rate Limite Reamaining: ", currentRateLimitForMe);

	// Create a new Twitter client
	// const addedRules = await client.v2.updateStreamRules({
	// 	add: [{ value: "#Poker  -is:reply ", tag: "Pk" }],
	// });

	const stream = await client.v2.searchStream();

	// Delete rules
	// const deleteRules = await client.v2.updateStreamRules({
	// 	delete: {
	// 		ids: ["1638357851260473346"],
	// 	},
	// });

	// Show Rules
	// Log every rule ID
	const rules = await client.v2.streamRules();
	console.log(rules);

	bot.start(async (ctx) => {
		ctx.reply("Welcome, starting stream from Twitter!");
		await stream.reconnect();
		stream.on(ETwitterStreamEvent.Data, async (tweet) => {
			// const message = `New tweet from ${tweet.user.name}: ${tweet.text}`;
			console.log(tweet);
			try {
				await bot.telegram.sendMessage(
					process.env.CHAT_ID,
					`${tweet.data.text} \n Link: https://twitter.com/i/web/status/${tweet.data.id}`
				);

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
					// Emitted when a Twitter sent a signal to maintain connection active
					ETwitterStreamEvent.DataKeepAlive,
					() => console.log("Twitter has a keep-alive packet.")
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
				} else {
					console.error(error);
					await bot.telegram.sendMessage(
						process.env.CHAT_ID,
						`Error: Code ${error.code}, rateLimit: ${error.rateLimit}`
					);
					await stream.reconnect();
				}
			}
		});
	});

	bot.command("stop", (ctx) => {
		ctx.reply("Stop streaming Twitter!");
		stream.destroy();
	});

	bot.launch();

	// Enable graceful stop
	process.once("SIGINT", () => bot.stop("SIGINT"));
}
main();
