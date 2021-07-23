"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
dotenv_1.config({ path: path_1.default.resolve(__dirname, '../.env') });
const manager = new discord_js_1.ShardingManager(path_1.default.resolve(__dirname, 'bot.js'), { token: process.env.DISCORD_TOKEN });
manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));
manager.spawn();
//# sourceMappingURL=index.js.map