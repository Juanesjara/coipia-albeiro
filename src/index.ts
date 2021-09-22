import { config } from 'dotenv'
import path from 'path'
const discord = require('discord.js');
//import  { ShardingManager,} from 'discord.js'
config({ path: path.resolve(__dirname, '../.env') })

const manager = new discord.ShardingManager(
    path.resolve(__dirname, 'bot.js'),
    { token: process.env.DISCORD_TOKEN }
)
manager.on('shardCreate', (shard: { id: any; }) => console.log(`Launched shard ${shard.id}`))
manager.spawn()

//js que agregue del nuevo bot de musica

const fs = require('fs');


const client = new discord.Client({ disableMentions: 'everyone' }) ;

import { Player } from 'discord-player'

client.player = new Player(client);
client.config = require('./config/bot');
client.emotes = client.config.emojis;
client.filters = client.config.filters;
client.commands = new discord.Collection();

client.on('message', (message: { content: string; channel: { send: (arg0: string) => void; }; })=>{
    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    if(command === '13'){
        message.channel.send(`mientras mas me la mama mas me crece`);
    }
});

client.on('voiceStateUpdate', (oldState: any, newState: any) => {

    //console.log("oldsate",oldState.channel)
    // console.log("oldsate",oldState.guild)
    
    //console.log("new channel",newState.channels)
    //console.log("new",newState.guild)
    
    var channel = oldState.guild.me.voice.channelID;
    var channelx = newState.channel;
    console.log("channel oldstate", channel)
    console.log("soy oldstate.id",oldState.id)
    console.log("soy newstate.channel", newState.channel?.id)
    //console.log("channel new state", channelx)

    // if nobody left the channel in question, return.
    if (oldState.id !==  oldState.guild.me.voice.channelID || newState.channel?.id){
        console.log("pase por el return")
        return;
    }
  
    // otherwise, check how many people are in the channel now
    if (!oldState.channel.members.size as any - 1) {
        setTimeout(() => { // if 1 (you), wait five minutes
            if (!oldState.channel.members.size as any - 1) // if there's still 1 member, 
            oldState.channel.leave(); // leave
        }, 300000); // (5 min in ms)
    }
  })

fs.readdirSync('./comandos').forEach((dirs: any) => {
    const commands = fs.readdirSync(`./comandos/${dirs}`).filter((files: string) => files.endsWith('.js'));

    for (const file of commands) {
        const command = require(`./comandos/${dirs}/${file}`);
        //console.log(`Loading command ${file}`);
        client.commands.set(command.name.toLowerCase(), command);
    };
});

const events = fs.readdirSync('./events').filter((file: string) => file.endsWith('.js'));
const player = fs.readdirSync('./player').filter((file: string) => file.endsWith('.js'));

for (const file of events) {
    //console.log(`Loading discord.js event ${file}`);
    const event = require(`./events/${file}`);
    client.on(file.split(".")[0], event.bind(null, client));
};

for (const file of player) {
   // console.log(`Loading discord-player event ${file}`);
    const event = require(`./player/${file}`);
    client.player.on(file.split(".")[0], event.bind(null, client));
};

client.login(client.config.discord.token);
