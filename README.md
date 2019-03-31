# Guess the Song with Google Translator

It's a basic text-based Guess the Song game bot for Telegram but with a twist.

## The idea
As you know, [Google Translator](https://translate.google.fi/) often returns hilarious results. Google also offers an free* API for it. Combining those results in some ~~stupid~~ great ideas. So, what if there were a game where the player is presented with some lyrics of popular songs that are run through the _so accurate_ translation service and then the played had to guess what song the orignal lyrics were from? Maybe throw in couple cat pictures for good measure?

## The prototype
And that's exactly what I did. My protoype only includes ten songs, but you get the idea. Telegram, and especially it's bot API, were totally a new thing for me, so the last ~~24~~ 23 hours were a very good learning experience. Instead of raw Telegram Bot API I decided to use a NodeJS framework called [Telegraf](https://telegraf.js.org/), whitch turned out to be very beginner friendly and easy to use.

I was planning to host the bot on my RPi but it had other plans. Therefore I had to host it on Heroku, whitch is sub-optimal, to say at least.

## How to play
Just search `@GtS_translate_bot` on Telegram. Group invites and inline mode are disabled, so the only way to play is to start a direct chat with the bot. The bot will tell you all other instructions you need.

## Possible further development
I didn't have time to look into it at this time but there might be an API for song lyrics too. If there is, it would allow almost endless games.
