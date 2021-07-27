import { MusicQuiz } from './music-quiz';
import { QuizArgs } from './types/quiz-args';
import { Command, CommandoClient, CommandoMessage } from "discord.js-commando"
import { Message } from "discord.js"

export class MusicQuizCommand extends Command {
    constructor(client: CommandoClient) {
        super(client, {
            name: 'music-quiz',
            memberName: 'music-quiz',
            group: 'music',
            description: 'Music Quiz from Spotify playlists',
            guildOnly: true,
            throttling: {usages: 1, duration: 10},
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
        })
    }

    async run(message: CommandoMessage, args: QuizArgs, fromPattern: boolean): Promise<Message | Message[]> {
        if (message.guild.quiz) {
            return message.say('ya hay un quiz corriendo')
        }

        if (message.member.voice.channel === null) {
            return message.say('conectate a un canal de voz elton')
        }

        message.guild.quiz = new MusicQuiz(message, args)

        try {
            message.guild.quiz.start()
        } catch (e) {
            console.log("Process ded");
        }
    }
}
