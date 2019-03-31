"use strict";

const fs = require("fs");
const request = require("request");
const Translate = require("@google-cloud/translate");

const catAPIUrl = "https://api.thecatapi.com/v1/images/search";
const catFactsAPIUrl = "https://catfact.ninja/fact";

// Fast and dirty way of keeping my Heroku instance from falling asleep
setInterval(() => {
    request.get({
        url: "https://telegram-bot-gts.herokuapp.com/"
    },(error) => {
        if(!error){
            console.info("Just keeping myself alive!");
        }
        else{
            console.error(error);
        }
    });
},600000);

// Loading the JSON data
let songs;
let languages;
fs.readFile("./data.json","UTF-8",(error,data) => {
    if(!error){
        try{
            data = JSON.parse(data);
        }
        catch(error){
            throw error;
        }

        songs = data[0];
        languages = data[1];
        console.info(`All songs loaded! There are ${songs.length} in total`);
    }
    else{
        throw error;
    }
});

const translator = new Translate.Translate({
    projectId: "gts-236118"
});

module.exports = {
    // There are much better ways of doing what I'm doing than this pyramid of doom...
    // Also, there might be issues if many peole are playing at the same time. I didn't have the time to test that.
    // But at least it works for a one player, okay. :D
    round: async (ctx) => {
        if(ctx.session.gameData.playedSongs.length >= songs.length){
            // All songs played
            ctx.reply(`This prototype only includes ${songs.length} songs and you played them all. Come back later for more or use /newgame to play same songs again. Thank you for playing!`);
            ctx.session.gameData.state = 4; // Game ended
            setTimeout(() => {
                // Because *of course* we need some cat pictures...
                // And finally got a good use for that Cat Facts API too... :D
                ctx.reply("Also... Have a cat!");
                request.get({
                    url: catAPIUrl,
                    json: true
                },(error,response,body) => {
                    if(!error && response.statusCode === 200){
                        ctx.replyWithPhoto(body[0].url);
                    }
                    else{
                        console.error(error);
                        console.info(`HTTP response code: ${response.statusCode}`);
                        ctx.reply("Oh no! It seems that Cat API is down! :O");
                    }
                    setTimeout(() => {
                        request.get({
                            url: catFactsAPIUrl,
                            json: true
                        },(error,response,body) => {
                            if(!error && response.statusCode === 200){
                                ctx.reply(`Did you know: ${body.fact || "There are over 500 million domestic cats in the world."}`);
                            }
                            else{
                                ctx.reply("Oh no! It seems that Cat Facts API is down! :O");
                            }
                        });
                    },3000);
                })
            },4000);
            return;
        }

        ctx.reply(`Round ${++ctx.session.gameData.round} / ${songs.length}`);
        if(ctx.session.gameData.round % 4 === 0){
            setTimeout(() => {
                ctx.reply("Tip: Use /stop to stop the current game.");
            },1500);
        }
        ctx.reply("Please wait!");

        while(true){
            ctx.session.gameData.selected_index = Math.floor(Math.random() * songs.length); // Let's draw a random song
            // Then we draw a another one until we get one that's not already been played
            if(!ctx.session.gameData.playedSongs.includes(ctx.session.gameData.selected_index)){
                break;
            }
        }
        ctx.session.gameData.playedSongs.push(ctx.session.gameData.selected_index);

        // Google Translate
        // First, let's roll a dice and select ten languages in a random order
        let translateTo = [];
        for(let i = 0;i < 10;i++){
            translateTo.push(languages[Math.floor(Math.random() * languages.length)]);
        }
        //console.log(translateTo);

        // Then we actually call the API and do the translation, one by one
        let translation = await translator.translate(songs[ctx.session.gameData.selected_index].lyrics,translateTo[0]);
        translation = await translator.translate(translation[0],translateTo[1]);
        translation = await translator.translate(translation[0],translateTo[2]);
        translation = await translator.translate(translation[0],translateTo[3]);
        if(!ctx.session.gameData.easyMode){
            translation = await translator.translate(translation[0],translateTo[4]);
            translation = await translator.translate(translation[0],translateTo[5]);
            translation = await translator.translate(translation[0],translateTo[6]);
            translation = await translator.translate(translation[0],translateTo[7]);
            translation = await translator.translate(translation[0],translateTo[8]);
            translation = await translator.translate(translation[0],translateTo[9]);
        }
        // Last step is ofc to translate it back to English
        translation = await translator.translate(translation[0],(ctx.session.gameData.fi) ? "fi" : "en");

        ctx.reply(`🎶\n${translation[0].replace(/\./g,"\n")}🎶\n\nWhat popular song is this according to Google Translator?`);
        ctx.session.gameData.state = 2; // Playing, waiting for input
    },
    guess: (ctx,callback) => {
        //console.log(ctx.session.gameData.answers);
        let theGuess = ctx.message.text.toLowerCase();
        //console.log(theGuess);
        if(songs[ctx.session.gameData.selected_index].answers.includes(theGuess)){
            // The answer was correct
            ctx.reply("Correct!");
            ctx.reply(`Original:\n\n${songs[ctx.session.gameData.selected_index].lyrics.replace(/\./g,"\n")}`);
            return callback(true);
        }
        else{
            return callback(false);
        }
    },
    skip: (ctx,callback) => {
        ctx.reply(`The correct answer would have been ${songs[ctx.session.gameData.selected_index].answers[0].toUpperCase()} or ${songs[ctx.session.gameData.selected_index].answers[1].toUpperCase()}`);
        ctx.reply(`Original:\n\n${songs[ctx.session.gameData.selected_index].lyrics.replace(/\./g,"\n")}`);
        return callback();
    }
};