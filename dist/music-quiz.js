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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicQuiz = void 0;
const ytdl_core_discord_1 = __importDefault(require("ytdl-core-discord"));
const spotify_1 = __importDefault(require("./spotify"));
const scrape_youtube_1 = __importDefault(require("scrape-youtube"));
const stopCommand = '!stop';
const skipCommand = '!skip';
class MusicQuiz {
    constructor(message, args) {
        this.currentSong = 0;
        this.skippers = [];
        this.reactPermissionNotified = false;
        this.guild = message.guild;
        this.textChannel = message.channel;
        this.voiceChannel = message.member.voice.channel;
        this.arguments = args;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.songs = yield this.getSongs(this.arguments.playlist, parseInt(this.arguments.songs, 10));
            if (!this.songs || this.songs.length === 0) {
                if (this.songs && this.songs.length === 0) {
                    yield this.textChannel.send('Playlist contains no songs');
                }
                this.finish();
                return;
            }
            try {
                this.connection = yield this.voiceChannel.join();
            }
            catch (e) {
                yield this.textChannel.send('Could not join voice channel. Is it full?');
                yield this.finish();
                return;
            }
            this.currentSong = 0;
            this.scores = {};
            this.textChannel.send(`
            **Let's get started**! :headphones: :tada:
            **${this.songs.length}** Canciones han sido escogidas aleatoriamente  de la playlist
            tienes un minuto para adivinarlas.

            ${this.pointText()}

            Escribe \`${stopCommand}\` para detener el quiz
            Escribe \`${skipCommand}\` para pasar a la siguiente cancion

            - Jara es un Dios
        `.replace(/  +/g, ''));
            this.startPlaying();
            this.messageCollector = this.textChannel
                .createMessageCollector((message) => !message.author.bot)
                .on('collect', message => this.handleMessage(message));
        });
    }
    startPlaying() {
        return __awaiter(this, void 0, void 0, function* () {
            this.titleGuessed = false;
            this.artistGuessed = false;
            if (this.arguments.only.toLowerCase() === 'artist') {
                this.titleGuessed = true;
            }
            else if (this.arguments.only.toLowerCase() === 'title') {
                this.artistGuessed = true;
            }
            const song = this.songs[this.currentSong];
            const link = yield this.findSong(song);
            if (!link) {
                this.nextSong('Could not find the song on Youtube. Skipping to next.');
                return;
            }
            try {
                this.musicStream = yield ytdl_core_discord_1.default(link);
            }
            catch (e) {
                console.error(e, "hola");
                console.error(link, "soy el link");
                this.nextSong('Could not stream the song from Youtube. Skipping to next. aaaaaaaaaaa' + e);
                return;
            }
            this.songTimeout = setTimeout(() => {
                this.nextSong('Song was not guessed in time');
            }, 1000 * 60);
            try {
                this.voiceStream = this.connection.play(this.musicStream, { type: 'opus', volume: .5 });
                this.voiceStream.on('error', () => {
                    this.textChannel.send('Connection got interrupted. Please try again');
                    this.finish();
                });
                this.voiceStream.on('finish', () => this.finish());
                this.voiceStream;
            }
            catch (e) {
                console.error(e);
                this.textChannel.send('Connection got interrupted. Please try again');
                this.finish();
            }
        });
    }
    handleMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = message.content.toLowerCase();
            if (content === stopCommand) {
                yield this.printStatus('Quiz stopped!');
                yield this.finish();
                return;
            }
            if (content === skipCommand) {
                yield this.handleSkip(message.author.id);
                return;
            }
            const song = this.songs[this.currentSong];
            let score = this.scores[message.author.id] || 0;
            let correct = false;
            if (!this.titleGuessed && content.includes(song.title.toLowerCase())) {
                score = score + 2;
                this.titleGuessed = true;
                correct = true;
                yield this.reactToMessage(message, '☑');
            }
            if (!this.artistGuessed && content.includes(song.artist.toLowerCase())) {
                score = score + 3;
                this.artistGuessed = true;
                correct = true;
                yield this.reactToMessage(message, '☑');
            }
            this.scores[message.author.id] = score;
            if (this.titleGuessed && this.artistGuessed) {
                this.nextSong('Cancion adivinada!');
            }
            if (!correct) {
                yield this.reactToMessage(message, '❌');
            }
        });
    }
    handleSkip(userID) {
        if (this.skippers.includes(userID)) {
            return;
        }
        this.skippers.push(userID);
        const members = this.voiceChannel.members
            .filter(member => !member.user.bot);
        if (this.skippers.length === members.size) {
            this.nextSong('Song skipped!');
            return;
        }
        this.textChannel.send(`**(${this.skippers.length}/${members.size})** to skip the song`);
    }
    finish() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.songTimeout)
                clearTimeout(this.songTimeout);
            if (this.messageCollector)
                this.messageCollector.stop();
            if (this.voiceStream)
                this.voiceStream.destroy();
            if (this.musicStream)
                this.musicStream.destroy();
            if (this.guild.quiz)
                this.guild.quiz = null;
            this.voiceChannel.leave();
        });
    }
    nextSong(status) {
        if (this.songTimeout)
            clearTimeout(this.songTimeout);
        this.printStatus(status);
        if (this.currentSong + 1 === this.songs.length) {
            return this.finish();
        }
        this.currentSong++;
        this.skippers = [];
        if (this.musicStream)
            this.musicStream.destroy();
        if (this.voiceStream)
            this.voiceStream.destroy();
        this.startPlaying();
    }
    printStatus(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const song = this.songs[this.currentSong];
            yield this.textChannel.send(`
            **(${this.currentSong + 1}/${this.songs.length})** ${message}
            > **${song.title}** by **${song.artist}**
            > Link: || ${song.link} ||

            **__SCORES__**
            ${this.getScores()}
        `.replace(/  +/g, ''));
        });
    }
    getScores() {
        return this.voiceChannel.members
            .filter(member => !member.user.bot)
            .array()
            .sort((first, second) => (this.scores[first.id] || 0) < (this.scores[second.id] || 0) ? 1 : -1)
            .map((member, index) => {
            let position = `**${index + 1}.** `;
            if (index === 0) {
                position = ':first_place:';
            }
            else if (index === 1) {
                position = ':second_place:';
            }
            else if (index === 2) {
                position = ':third_place:';
            }
            return `${position} <@!${member.id}> ${this.scores[member.id] || 0} points`;
        })
            .join('\n');
    }
    reactToMessage(message, emoji) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield message.react(emoji);
            }
            catch (e) {
                if (this.reactPermissionNotified) {
                    return;
                }
                this.reactPermissionNotified = true;
                this.textChannel.send(`
                Please give me permission to react to messages.
                You can easily do this by clicking the following link and adding me to your server again.
                https://discordapp.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&scope=bot&permissions=3147840
            `.replace(/  +/g, ''));
            }
        });
    }
    getSongs(playlist, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const spotify = new spotify_1.default();
            yield spotify.authorize();
            if (playlist.includes('spotify.com/playlist')) {
                playlist = playlist.match(/playlist\/([^?]+)/)[1] || playlist;
            }
            try {
                return (yield spotify.getPlaylist(playlist))
                    .sort(() => Math.random() > 0.5 ? 1 : -1)
                    .filter((song, index) => index < amount)
                    .map(song => ({
                    link: `https://open.spotify.com/track/${song.id}`,
                    previewUrl: song.preview_url,
                    title: this.stripSongName(song.name),
                    artist: (song.artists[0] || {}).name
                }));
            }
            catch (error) {
                this.textChannel.send('Could not retrieve the playlist. Make sure it\'s public');
                return null;
            }
        });
    }
    findSong(song) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // const result = await ytsr(`${song.title} - ${song.artist}`, { limit: 1 })
                const result = yield scrape_youtube_1.default.searchOne(`${song.title} - ${song.artist}`);
                return (_a = result === null || result === void 0 ? void 0 : result.link) !== null && _a !== void 0 ? _a : null;
            }
            catch (e) {
                yield this.textChannel.send('Oh no... Youtube police busted the party :(\nPlease try again later.');
                this.finish();
                throw e;
            }
        });
    }
    /**
     * Will remove all excess from the song names
     * Examples:
     * death bed (coffee for your head) (feat. beabadoobee) -> death bed
     * Dragostea Din Tei - DJ Ross Radio Remix -> Dragostea Din Tei
     *
     * @param name string
     */
    stripSongName(name) {
        return name.replace(/ \(.*\)/g, '')
            .replace(/ - .*$/, '');
    }
    pointText() {
        if (this.arguments.only === 'artist') {
            //return 'Guess the artist of the song by typing in chat. When guessed corretly you are awarded **3 points**.'
            return 'Adivina el artista de la cancion y ganaras **3 points**.';
        }
        if (this.arguments.only === 'title') {
            //return 'Guess the title of the song by typing in chat. When guessed corretly you are awarded **2 points**.'
            return 'Adivina el titulo titulo de la cancion y ganaras **2 points**.';
        }
        /*return `
            Guess the song and artist by typing in chat. Points are awarded as follows:
            > Artist - **3 points**
            > Title - **2 points**
            > Artist + title - **5 points**
        `.replace(/  +/g, '')*/
        return `
            Adivina la cancion y el artista para ganar los siguientes puntos:
            > Artista - **3 points**
            > Titulo - **2 points**
            > Artista + titulo - **5 points**
        `.replace(/  +/g, '');
    }
}
exports.MusicQuiz = MusicQuiz;
//# sourceMappingURL=music-quiz.js.map