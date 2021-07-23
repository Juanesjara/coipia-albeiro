"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commands_1 = require("./commands");
const discord_js_1 = require("discord.js");
const discord_js_commando_1 = require("discord.js-commando");
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
dotenv_1.config({ path: path_1.default.resolve(__dirname, '../.env') });
discord_js_1.Structures.extend('Guild', Guild => {
    class MusicGuild extends Guild {
    }
    return MusicGuild;
});
const client = new discord_js_commando_1.CommandoClient({
    commandPrefix: process.env.PREFIX,
    owner: process.env.DISCORD_OWNER_ID
});
client.registry
    .registerDefaultTypes()
    .registerGroup('music')
    .registerCommand(commands_1.MusicQuizCommand);
client.once('ready', () => {
    console.log('osi');
    client.user.setActivity('Ser el simp de jara');
});
client.on("error", (e) => console.error('Discord error', e));
client.on("warn", (e) => console.warn('Discord warn', e));
client.on("disconnect", (e) => console.info('Discord disconnect event', e));
client.login(process.env.DISCORD_TOKEN);
//# sourceMappingURL=bot.js.map