"use strict";

// Jani Haiko, 2019
// Junction Online Challenge entry
// March 2019
// https://github.com/ojaha065/junctionBot

// https://telegraf.js.org/
const Telegraf = require("telegraf");
const session = require("telegraf/session");

const start = "Welcolme! Nice to have you here.\n\nUse /newgame to start the game or /help to read to instructions.";
const help = "Instructions:\n\nUse /newgame to start. You will be presented with the Google Translators interpretation of some popular song. Your job is to guess what song it is. Easy, right? ;) If you can't remember the name of the song, you can also type the artist/band name. Use /skip to move to the next song.\n\nThis bot was made in 23 hours during the Junction Online Challenge.";

// Let's create a new telegram client with Telegraf
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Heroku support
const port = process.env.PORT || 8000;
bot.telegram.setWebhook(`https://telegram-bot-gts.herokuapp.com/bot${process.env.TELEGRAM_TOKEN}`);
bot.startWebhook(`/bot${process.env.TELEGRAM_TOKEN}`,null,port);

// To help keep server.js clean let's put most of the "boring" code inside a different file
const game = require("./game.js");

// Session control
bot.use(session());
bot.use((ctx,next) => {
    // The gameData object needs to always exist
    if(!ctx.session.gameData){
        ctx.session.gameData = {
            state: 0, // Not playing
            round: 0,
            selected_index: null, // Which song from the database is this user currently guessing
            easyMode: false,
            playedSongs: [], // This user has already guessed these songs, so they shouldn't be played again
        };
    }
    return next();
});

// Common Telegram bot commands
// Most bots support these
bot.start((ctx) => {
    ctx.reply(start);
});
bot.help((ctx) => {
    ctx.reply(help);
});
bot.settings((ctx) => {
    ctx.reply("Sorry, I don't have any settings.");
});

// Custom commands (for debugging)
bot.command("ping",(ctx) => {
    ctx.reply("PONG!");
});
bot.command("whoami",(ctx) => {
    ctx.reply(ctx.from.id);
});
bot.command("clear",(ctx) => {
    ctx.session.gameData = null;
    ctx.reply("All data cleared!");
});

// Game logic
bot.command(["newgame","new"],(ctx) => {
    if(ctx.session.gameData.state !== 0){ // We reset all game data if this user has a active game
        ctx.reply("Aborting current game...");
        ctx.session.gameData = {
            state: 0,
            round: 0,
            selected_index: null,
            easyMode: false,
            playedSongs: []
        };
    }

    ctx.reply("Okay! Let's start!");
    ctx.session.gameData.state = 1; // Starting up

    setTimeout(() => {
        game.round(ctx);
    },1000);
});
bot.command(["easymode","easy"],(ctx) => {
    if(ctx.session.gameData.state === 2){
        // Toggling the easy mode
        if(!ctx.session.gameData.easyMode){
            ctx.session.gameData.easyMode = true;
            ctx.reply("Easy mode activated!");
        }
        else{
            ctx.session.gameData.easyMode = false;
            ctx.reply("Easy mode deactivated!");
        }
    }
    else{
        ctx.reply("This command is not available right now.");
    }
});
bot.command("skip",(ctx) => {
    if(ctx.session.gameData.state === 2){
        ctx.session.gameData.state = 3;
        game.skip(ctx,() => {
            setTimeout(() => {
                game.round(ctx);
            },1500);
        });
    }
    else{
        ctx.reply("This command is not available right now.");
    }
});
bot.command("stop",(ctx) => {
    ctx.reply("Stopping! Thank you for playing!");
    ctx.session.gameData = null;
});
// Hidden command. When enabled, the last translation language is Finnish instead of English.
// Makes the game at least 2x harder
bot.command("suomi",(ctx) => {
    ctx.session.gameData.fi = true;
    ctx.reply("Suomenkielinen tila otettu käyttöön.");
});
bot.on("text",(ctx) => {
    if(ctx.session.gameData.state !== 2){
        ctx.reply("Use /newgame to start a new game or /help to get list of available commands.");
    }
    else{
        ctx.session.gameData.state = 3; // Playing, waiting for the server
        game.guess(ctx,(correct) => {
            if(correct){
                // The answer was correct, let's wait a bit before continuing
                setTimeout(() => {
                    game.round(ctx);
                },2500);
            }
            else{
                ctx.reply("Sorry, that's not right. Maybe try again?");
                if(!ctx.session.gameData.easyMode && Math.floor(Math.random() * 5) === 0){
                    // 1/5 chance of showing this message
                    ctx.reply("Too hard? Try /easymode and/or do /skip");
                }
                ctx.session.gameData.state = 2; // Playing, waiting for input
            }
        });
    }
});

// Let's actually start the server
bot.launch().then(() => {
    console.info("The server was successfully started");
}).catch((error) => {
    console.error(error);
});