import { MessageCollector, VoiceChannel, TextChannel, Guild, DMChannel } from 'discord.js';
import ytdl from 'ytdl-core-discord'
import { QuizArgs } from './types/quiz-args'
import { CommandoMessage } from 'discord.js-commando'
import Spotify from './spotify'
import Youtube from 'scrape-youtube'
import { Song } from 'song';
import { VoiceConnection } from 'discord.js';
import internal from 'stream'
import { StreamDispatcher } from 'discord.js';
import { NewsChannel } from 'discord.js';

const stopCommand = '=stop'
const skipCommand = '=skip'

export class MusicQuiz {
    guild: Guild
    textChannel: TextChannel | DMChannel | NewsChannel
    voiceChannel: VoiceChannel
    messageCollector: MessageCollector
    arguments: QuizArgs
    songs: Song[]
    currentSong: number = 0
    skippers: string[] = []
    connection: VoiceConnection
    scores: {[key: string]: number}
    artistGuessed: boolean
    titleGuessed: boolean
    musicStream: internal.Readable
    voiceStream: StreamDispatcher
    songTimeout: NodeJS.Timeout
    reactPermissionNotified: boolean = false

    constructor(message: CommandoMessage, args: QuizArgs) {
        this.guild = message.guild
        this.textChannel = message.channel
        this.voiceChannel = message.member.voice.channel
        this.arguments = args
    }

    async start() {
        this.songs = await this.getSongs(
            this.arguments.playlist,
            parseInt(this.arguments.songs, 10)
        )

        if (!this.songs || this.songs.length === 0) {
            if (this.songs && this.songs.length === 0) {
                await this.textChannel.send('Esta playlist no contiene Canciones')
            }

            this.finish()

            return
        }

        try {
            this.connection = await this.voiceChannel.join()
        } catch (e) {
            await this.textChannel.send('No me pude unir a tu canal, verifica que no este lleno')
            await this.finish()

            return
        }

        this.currentSong = 0
        this.scores = {}
        this.textChannel.send(`
            **Let's get started**! :headphones: :tada:
            **${this.songs.length}** Canciones han sido escogidas aleatoriamente  de la playlist
            tienes un minuto para adivinarlas.

            ${this.pointText()}

            Escribe \`${stopCommand}\` para detener el quiz
            Escribe \`${skipCommand}\` para pasar a la siguiente cancion

            - Jara es un Dios
        `.replace(/  +/g, ''))
        this.startPlaying()

        this.messageCollector = this.textChannel
            .createMessageCollector((message: CommandoMessage) => !message.author.bot)
            .on('collect', message => this.handleMessage(message))
    }

    async startPlaying() {
        this.titleGuessed = false
        this.artistGuessed = false
        if (this.arguments.only.toLowerCase() === 'artist') {
            this.titleGuessed = true
        } else if (this.arguments.only.toLowerCase() === 'title') {
            this.artistGuessed = true
        }

        const song = this.songs[this.currentSong]
        const link = await this.findSong(song)
        if (!link) {
            this.nextSong('No pude encontrar esta canción en youtube, voy a pasar a la siguiente')

            return
        }

        try {
            this.musicStream = await ytdl(link, {highWaterMark: 1<<25})
        } catch (e) {
            console.error(e, "hola");
            console.error(link, "soy el link")
            this.nextSong('No pude reproducir esta canción en youtube, voy a pasar a la siguiente' + e)
            return
        }

        this.songTimeout = setTimeout(() => {
            this.nextSong('no adivinaron la cancion :/')
        }, 1000 * 60);

        try {
            this.voiceStream = this.connection.play(this.musicStream, { type: 'opus', volume: .5 })

            this.voiceStream.on('error', () => {
                    this.textChannel.send('Jm pana me toste, Hasta mañana 🥵')

                    this.finish()
                })
            this.voiceStream.on('finish', () => this.finish())
            this.voiceStream
        } catch (e) {
            console.error(e);

            this.textChannel.send('Jm pana me toste, Hasta mañana 🥵')

            this.finish()
        }
    }

    async handleMessage(message: CommandoMessage) {
        const content = message.content.toLowerCase()
        if (content === stopCommand) {
            await this.printStatus('Quiz stopped!')
            await this.finish()

            return
        }

        if (content === skipCommand) {
            await this.handleSkip(message.author.id)

            return
        }

        const song = this.songs[this.currentSong]
        let score = this.scores[message.author.id] || 0
        let correct = false

        if (!this.titleGuessed && content.includes(song.title.toLowerCase())) {
            score = score + 2
            this.titleGuessed = true
            correct = true
            await this.reactToMessage(message, '😈')
            await this.reactToMessage(message, '✅')
            message.channel.send(`Listo el Pollo`);
        }

        if (!this.artistGuessed && content.includes(song.artist.toLowerCase())) {
            score = score + 3
            this.artistGuessed = true
            correct = true
            await this.reactToMessage(message, '😈')
            await this.reactToMessage(message, '✅')
            message.channel.send(`Listo el Pollo`);
            
        }
        this.scores[message.author.id] = score

        if (this.titleGuessed && this.artistGuessed) {
            this.nextSong('Listo el Pollo');
        }

        if (!correct) {
            await this.reactToMessage(message, `😡`)
            message.channel.send(`Oigan pues, -manin es aguevado`);
            
        }
    }

    handleSkip(userID: string) {
        if (this.skippers.includes(userID)) {
            return
        }

        this.skippers.push(userID)

        const members = this.voiceChannel.members
            .filter(member => !member.user.bot)
        if (this.skippers.length === members.size) {
            this.nextSong('Song skipped!')

            return
        }

        this.textChannel.send(`**(${this.skippers.length}/${members.size})** to skip the song`)
    }

    async finish() {
        if (this.songTimeout) clearTimeout(this.songTimeout)
        if (this.messageCollector) this.messageCollector.stop()
        if (this.voiceStream) this.voiceStream.destroy()
        if (this.musicStream) this.musicStream.destroy()

        if (this.guild.quiz) this.guild.quiz = null
        this.voiceChannel.leave()
    }

    nextSong(status: string) {
        if (this.songTimeout) clearTimeout(this.songTimeout)
        this.printStatus(status)

        if (this.currentSong + 1 === this.songs.length) {
            return this.finish()
        }

        this.currentSong++
        this.skippers = []
        if (this.musicStream) this.musicStream.destroy()
        if (this.voiceStream) this.voiceStream.destroy()
        this.startPlaying()
    }

    async printStatus(message: string) {
        const song = this.songs[this.currentSong]
        await this.textChannel.send(`
            **(${this.currentSong + 1}/${this.songs.length})** ${message}
            > **${song.title}** by **${song.artist}**
            > Link: || ${song.link} ||

            **__SCORES__**
            ${this.getScores()}
        `.replace(/  +/g, ''))
    }

    getScores(): string {
        return this.voiceChannel.members
            .filter(member => !member.user.bot)
            .array()
            .sort((first, second) => (this.scores[first.id] || 0) < (this.scores[second.id] || 0) ? 1 : -1)
            .map((member, index) => {
                let position = `**${index + 1}.** `
                if (index === 0) {
                    position = ':first_place:'
                } else if (index === 1) {
                    position = ':second_place:'
                } else if (index === 2) {
                    position = ':third_place:'
                }

                return `${position} <@!${member.id}> ${this.scores[member.id] || 0} puntos`
            })
            .join('\n')
    }

    async reactToMessage(message: CommandoMessage, emoji: string) {
        try {
            await message.react(emoji)
        } catch (e) {
            if (this.reactPermissionNotified) {
                return
            }

            this.reactPermissionNotified = true
            this.textChannel.send(`
                Te pido el favor de que me dejes reaccionar a mensajes, o
                puedes hacer esto facilmente haciendo click en el enlace e invitandome de nuevo a su servidor
                https://discordapp.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&scope=bot&permissions=3147840
            `.replace(/  +/g, ''))
        }

    }

    async getSongs(playlist: string, amount: number): Promise<Song[]> {
        const spotify = new Spotify()
        await spotify.authorize()
        if (playlist.includes('spotify.com/playlist')) {
            playlist = playlist.match(/playlist\/([^?]+)/)[1] || playlist
        }

        try {
            return (await spotify.getPlaylist(playlist))
                .sort(() => Math.random() > 0.5 ? 1 : -1)
                .filter((song, index) => index < amount)
                .map(song => ({
                    link: `https://open.spotify.com/track/${song.id}`,
                    previewUrl: song.preview_url,
                    title: this.stripSongName(song.name),
                    artist: (song.artists[0] || {}).name
                }))
        } catch (error) {

            this.textChannel.send('No pude extraer ninguna cancion de esta playlist, asegurate de que sea publica')

            return null
        }
    }

    async findSong(song: Song): Promise<string> {
        try {
            // const result = await ytsr(`${song.title} - ${song.artist}`, { limit: 1 })
            const result = await Youtube.searchOne(`${song.title} - ${song.artist}`)

            return result?.link ?? null
        } catch (e) {
            await this.textChannel.send("youtube nos daño el juego, intenta de nuevo")
            this.finish()

            throw e
        }
    }

    /**
     * Will remove all excess from the song names
     * Examples:
     * death bed (coffee for your head) (feat. beabadoobee) -> death bed
     * Dragostea Din Tei - DJ Ross Radio Remix -> Dragostea Din Tei
     *
     * @param name string
     */
    stripSongName(name: string): string {
        return name.replace(/ \(.*\)/g, '')
            .replace(/ - .*$/, '')
    }

    pointText(): string {
        if (this.arguments.only === 'artist') {
            //return 'Guess the artist of the song by typing in chat. When guessed corretly you are awarded **3 points**.'
            return 'Adivina el artista de la cancion y ganaras **3 puntos**.'
        }

        if (this.arguments.only === 'title') {
            //return 'Guess the title of the song by typing in chat. When guessed corretly you are awarded **2 points**.'
            return 'Adivina el titulo titulo de la cancion y ganaras **2 puntos**.'
        }

        /*return `
            Guess the song and artist by typing in chat. Points are awarded as follows:
            > Artist - **3 points**
            > Title - **2 points**
            > Artist + title - **5 points**
        `.replace(/  +/g, '')*/
        return `
            Adivina la cancion y el artista para ganar los siguientes puntos:
            > Artista - **3 puntos**
            > Titulo - **2 puntos**
            > Artista + titulo - **5 puntos**
        `.replace(/  +/g, '')

    }
}
