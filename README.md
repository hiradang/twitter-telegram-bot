Tính năng: Stream Filter các tweet, retweet, reply, quote trên twitter, sau đó gửi đến bot telegram.

 - Tạo bot Telegram: https://core.telegram.org/bots#:~:text=%40BotSupport.-,How%20Do%20I%20Create%20a%20Bot%3F,who%20has%20your%20token%20will%20have%20full%20control%20over%20your%20bot.,-What%20Next%3F -> BOT_TOKEN

 - Nhập BEARER_TOKEN (.env)

 - Chạy ứng dụng:
  + step 1: yarn
  + step 2: node exampleV2.js

* Custom Rule khi filted stream Tweet:
Tại dòng 24 file exampleV2.js, đang sử dụng dụng rule filter là hagstag: #HungLV (value của Rule), với tag: Bl (tag của Rule).  
  - Thay đổi value để search stream các nội dung khác. 

* Lưu ý:
Khi gặp lỗi: This stream is currently at the maximum allowed connection limit.
Không chạy lại server nhiều lần, hãy đợi 15p rồi mới khởi động lại server. Khi đang gặp lỗi này, mỗi lần chạy lại server sẽ tăng thời gian chờ cho đến khi được phép sử dụng stream tiếp: https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/integrate/handling-disconnections#:~:text=Back%20off%20exponentially%20for%20HTTP%20429%20errors%20Rate%20limit%20exceeded.%20Start%20with%20a%201%20minute%20wait%20and%20double%20each%20attempt.%20Note%20that%20every%20HTTP%20429%20received%20increases%20the%20time%20you%20must%20wait%20until%20rate%20limiting%20will%20no%20longer%20be%20in%20effect%20for%20your%20account.
