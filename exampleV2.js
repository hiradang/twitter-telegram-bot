// Open a realtime stream of Tweets, filtered according to rules
// https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/quick-start

const needle = require("needle");
const { Telegraf } = require("telegraf");
require("dotenv/config");

// The code below sets the bearer token from your environment variables
// To set environment variables on macOS or Linux, run the export command below from the terminal:
// export BEARER_TOKEN='YOUR-TOKEN'
const bot = new Telegraf(process.env.BOT_TOKEN);
const token = process.env.BEARER_TOKEN;
var stream = null;

const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules";
const streamURL = "https://api.twitter.com/2/tweets/search/stream";

// this sets up two rules - the value is the search terms to match on, and the tag is an identifier that
// will be applied to the Tweets return to show which rule they matched
// with a standard project with Basic Access, you can add up to 25 concurrent rules to your stream, and
// each rule can be up to 512 characters long

// Edit rules as desired below
const rules = [{ value: "#HungLV", tag: "Bl" }];

async function getAllRules() {
	const response = await needle("get", rulesURL, {
		headers: {
			authorization: `Bearer ${token}`,
		},
	});

	if (response.statusCode !== 200) {
		console.log("Error:", response.statusMessage, response.statusCode);
		throw new Error(response.body);
	}

	return response.body;
}

async function deleteAllRules(rules) {
	if (!Array.isArray(rules.data)) {
		return null;
	}

	const ids = rules.data.map((rule) => rule.id);

	const data = {
		delete: {
			ids: ids,
		},
	};

	const response = await needle("post", rulesURL, data, {
		headers: {
			"content-type": "application/json",
			authorization: `Bearer ${token}`,
		},
	});

	if (response.statusCode !== 200) {
		throw new Error(response.body);
	}

	return response.body;
}

async function setRules() {
	const data = {
		add: rules,
	};

	const response = await needle("post", rulesURL, data, {
		headers: {
			"content-type": "application/json",
			authorization: `Bearer ${token}`,
		},
	});

	if (response.statusCode !== 201) {
		throw new Error(response.body);
	}

	return response.body;
}

function streamConnect(retryAttempt, ctx) {
	const stream = needle.get(streamURL, {
		headers: {
			"User-Agent": "v2FilterStreamJS",
			Authorization: `Bearer ${token}`,
		},
		timeout: 20000,
	});

	stream
		.on("data", async (data) => {
			try {
				const json = JSON.parse(data);
				console.log(json);
				ctx.reply(
					`${json.data.text} \n Link: https://twitter.com/i/web/status/${json.data.id}`
				);
				// A successful connection resets retry count.
				retryAttempt = 0;
			} catch (e) {
				if (
					data.detail ===
					"This stream is currently at the maximum allowed connection limit."
				) {
					console.log(data.detail);
					ctx.reply(data.detail);
					process.exit(1);
				} else {
					// Keep alive signal received. Do nothing.
				}
			}
		})
		.on("err", (error) => {
			if (error.code !== "ECONNRESET") {
				console.log(error.code);
				ctx.reply(error.message);
				process.exit(1);
			} else {
				// This reconnection logic will attempt to reconnect when a disconnection is detected.
				// To avoid rate limits, this logic implements exponential backoff, so the wait time
				// will increase if the client cannot reconnect to the stream.
				setTimeout(async () => {
					console.warn("A connection error occurred. Reconnecting...");
					ctx.reply("A connection error occurred. Reconnecting...");
					streamConnect(++retryAttempt);
				}, 2 ** retryAttempt);
			}
		});

	return stream;
}

bot.start(async (ctx) => {
	ctx.reply("Greate, Stream is connected");
	let currentRules;

	try {
		// Gets the complete list of rules currently applied to the stream
		const currentRules = await getAllRules();
		// Delete all rules. Comment the line below if you want to keep your existing rules.
		await deleteAllRules(currentRules);

		// Add rules to the stream. Comment the line below if you don't want to add new rules.
		await setRules();
	} catch (e) {
		console.error(e);
		process.exit(1);
	}

	// Listen to the stream.
	stream = streamConnect(0, ctx);
});

bot.help((ctx) => {
	ctx.reply("Hi, this bot is developed by Em Hùng Eo Vì🍑🍑");
});

bot.command("stop", (ctx) => {
	ctx.reply("Ok, Stream is stopped");
	if (stream !== null) {
		stream.destroy();
	}
});

bot.command("rule", async (ctx) => {
	// Gets the complete list of rules currently applied to the stream
	try {
		const currentRules = await getAllRules();
		currentRules.data.map((rule) => {
			ctx.reply(`id: ${rule.id}, value: ${rule.value}, tags: ${rule.tag}`);
		});
	} catch (error) {
		console.log(error);
	}
});
bot.launch();
