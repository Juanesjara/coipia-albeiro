"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
const discord = require('discord.js');
//import  { ShardingManager,} from 'discord.js'
dotenv_1.config({ path: path_1.default.resolve(__dirname, '../.env') });
const manager = new discord.ShardingManager(path_1.default.resolve(__dirname, 'bot.js'), { token: process.env.DISCORD_TOKEN });
manager.on('shardCreate', (shard) => console.log(`Launched shard ${shard.id}`));
manager.spawn();
//js que agregue del nuevo bot de musica
const fs = require('fs');
const client = new discord.Client({ disableMentions: 'everyone' });
const discord_player_1 = require("discord-player");
client.player = new discord_player_1.Player(client);
client.config = require('./config/bot');
client.emotes = client.config.emojis;
client.filters = client.config.filters;
client.commands = new discord.Collection();
fs.readdirSync('./comandos').forEach((dirs) => {
    const commands = fs.readdirSync(`./comandos/${dirs}`).filter((files) => files.endsWith('.js'));
    for (const file of commands) {
        const command = require(`./comandos/${dirs}/${file}`);
        //console.log(`Loading command ${file}`);
        client.commands.set(command.name.toLowerCase(), command);
    }
    ;
});
const events = fs.readdirSync('./events').filter((file) => file.endsWith('.js'));
const player = fs.readdirSync('./player').filter((file) => file.endsWith('.js'));
for (const file of events) {
    //console.log(`Loading discord.js event ${file}`);
    const event = require(`./events/${file}`);
    client.on(file.split(".")[0], event.bind(null, client));
}
;
for (const file of player) {
    // console.log(`Loading discord-player event ${file}`);
    const event = require(`./player/${file}`);
    client.player.on(file.split(".")[0], event.bind(null, client));
}
;
client.login(client.config.discord.token);
//# sourceMappingURL=index.js.map