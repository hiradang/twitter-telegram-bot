require("dotenv/config");
const { Telegraf } = require("telegraf");
const Twit = require("twit");
const amqp = require("amqplib");

const QUEUE_NAME = "telegram-messages";

const twitter = new Twit({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
});

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.telegram.sendMessage(1843999377, "Hello");

async function main() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  var stream = twitter.stream("statuses/filter", { track: "#Blockchain" });

  stream.on("tweet", async function (tweet) {
    if (tweet && tweet?.user?.followers_count > 1000) {
      await channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(tweet)));
    }
  });

  stream.on("error", (err) => console.log(err));

  channel.consume(
    QUEUE_NAME,
    async (msg) => {
      const tweet = JSON.parse(msg.content.toString());
      try {
        await bot.telegram.sendMessage(1843999377, tweet);
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
