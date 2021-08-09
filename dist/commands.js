"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicQuizCommand = void 0;
const music_quiz_1 = require("./music-quiz");
const discord_js_commando_1 = require("discord.js-commando");
class MusicQuizCommand extends discord_js_commando_1.Command {
    constructor(client) {
        super(client, {
            name: 'music-quiz',
            memberName: 'music-quiz',
            group: 'music',
            description: 'Music Quiz from Spotify playlists',
            guildOnly: true,
            throttling: { usages: 1, duration: 10 },
            args: [
                {
                    key: 'playlist',
                    prompt: 'Which playlist to play songs from',
                    type: 'string',
                },
                {
                    key: 'songs',
                    prompt: 'How many songs the quiz will contain',
                    type: 'string',
                    default: 10
                },
                {
                    key: 'only',
                    prompt: 'Only this answer is required; artist, title or both',
                    type: 'string',
                    oneOf: ['artist', 'title', 'both'],
                    default: 'both'
                }
            ]
        });
    }
    run(message, args, fromPattern) {
        return __awaiter(this, void 0, void 0, function* () {
            if (message.guild.quiz) {
                return message.say('ya hay un quiz corriendo');
            }
            if (message.member.voice.channel === null) {
                return message.say('conectate a un canal de voz  ome elton');
            }
            message.guild.quiz = new music_quiz_1.MusicQuiz(message, args);
            try {
                message.guild.quiz.start();
            }
            catch (e) {
                console.log("Process ded");
            }
        });
    }
}
exports.MusicQuizCommand = MusicQuizCommand;
//# sourceMappingURL=commands.js.map