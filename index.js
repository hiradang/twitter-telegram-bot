require("dotenv/config");
const { Telegraf } = require("telegraf");
// const Twit = require("twit");
const amqp = require("amqplib");
const { TwitterApi, ETwitterStreamEvent } = require("twitter-api-v2");

const QUEUE_NAME = "telegram-messages";

// const client = new TwitterApi({
//   appKey: process.env.CONSUMER_KEY,
//   appSecret: process.env.CONSUMER_SECRET,
//   accessToken: process.env.ACCESS_TOKEN,
//   accessSecret: process.env.ACCESS_TOKEN_SECRET,
// });

const client = new TwitterApi(process.env.BEARER_TOKEN);

const bot = new Telegraf(process.env.BOT_TOKEN);

async function main() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  // var stream = twitter.stream("statuses/filter", { track: "#Blockchain" });

  // stream.on("tweet", async function (tweet) {
  //   if (tweet && tweet?.user?.followers_count > 1000) {
  //     await channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(tweet)));
  //   }
  // });

  // stream.on("error", (err) => console.log(err));

  const addedRules = await client.v2.updateStreamRules({
    add: [{ value: "#Blockchain", tag: "BL" }],
  });

  const sampleFilterv2 = await client.v2.searchStream();

  sampleFilterv2.on(ETwitterStreamEvent.Data, (tweet) => {
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(tweet)));
  });

  channel.consume(
    QUEUE_NAME,
    async (msg) => {
      const tweet = JSON.parse(msg.content.toString());
      try {
        await bot.telegram.sendMessage(
          1843999377,
          `${tweet.data.text} \n Link: https://twitter.com/i/web/status/${tweet.data.id}`
        );
        channel.ack(msg);
      } catch (error) {
        console.error(error);
        channel.nack(msg);
      }
    },
    { noAck: false }
  );
}

main();
