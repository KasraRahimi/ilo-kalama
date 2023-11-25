import { AudioPlayer, AudioPlayerStatus, VoiceConnection, VoiceConnectionStatus, createAudioPlayer, createAudioResource, joinVoiceChannel } from '@discordjs/voice';
import { Ilo } from '@src/Ilo';
import { Guild, TextBasedChannel, VoiceBasedChannel } from 'discord.js';
import { YouTubeVideo } from 'play-dl';
import play from 'play-dl';

const TIMEOUT = 3_000;

export class Session {
    private readonly _guild: Guild;
    private _currentVideo: YouTubeVideo | null;
    private _queue: YouTubeVideo[] = [];
    private _connection: VoiceConnection;
    private _player: AudioPlayer;
    private _timeout: NodeJS.Timeout | undefined;
    private _client: Ilo;
    _textChannel: TextBasedChannel;

    constructor(guild: Guild, textChannel: TextBasedChannel, vc: VoiceBasedChannel, client: Ilo) {
        this._guild = guild;
        this._textChannel = textChannel;
        this._currentVideo = null;
        this._client = client;

        this._connection = this.getConnection(vc.id);
        this._player = createAudioPlayer();
        this._connection.subscribe(this._player);
        this.setPlayerEvents();
        this.setConnectionEvents();
    }

    get queue() {
        return this._queue;
    }

    get currentVideo() {
        return this._currentVideo;
    }

    setVideo(video: YouTubeVideo) {
        this._currentVideo = video;
    }

    async addToQueue(video: YouTubeVideo) {
        if (this._currentVideo === null) {
            this.setVideo(video);
            await this.play();
            return;
        }
        this._queue.push(video);
    };

    async playNext() {
        if (this._queue.length === 0) {
            this._currentVideo = null;
            this._player.stop();
            return;
        }
        const video = this._queue.shift();
        if (video) {
            this.setVideo(video);
            await this.play();
        }
    }

    async play() {
        if (this._currentVideo === null) return;
        this._textChannel.send(`Now playing: ${this._currentVideo.title}`);
        const stream = await play.stream(this._currentVideo.url);
        const resource = createAudioResource(stream.stream, { inputType: stream.type });
        this._player.play(resource);
    }

    async seek(seconds: number) {
        if (this._currentVideo === null) return;
        const stream = await play.stream(this._currentVideo.url, { seek: seconds });
        const resource = createAudioResource(stream.stream, { inputType: stream.type });
        this._player.play(resource);
    }

    pause() {
        this._player.pause();
    }

    resume() {
        this._player.unpause();
    }

    private getConnection(channelId: string): VoiceConnection {
        const adapterCreator = this._guild.voiceAdapterCreator;
        return joinVoiceChannel({
            channelId: channelId,
            guildId: this._guild.id,
            adapterCreator: adapterCreator
        });
    }

    private setPlayerEvents() {
        this._player.on('error', error => {
            console.error(error);
            this._textChannel.send('There was an error while playing audio.');
        });
        // Handle Idle state
        this._player.on(AudioPlayerStatus.Idle, async () => {
            await this.playNext();
            if (this._currentVideo) return;
            this._textChannel.send('Playback is over. Leaving voice channel in 30 seconds');
            this._timeout = setTimeout(() => {
                this.handleSessionEnd();
            }, TIMEOUT);
        });
        // Handle Playing state
        this._player.on(AudioPlayerStatus.Playing, () => {
            if (this._timeout) return;
            clearTimeout(this._timeout);
        });
    }

    private setConnectionEvents() {
        this._connection.on('error', error => {
            console.error(error);
            this._textChannel.send('There was an error while playing audio.');
        });
        this._connection.on(VoiceConnectionStatus.Destroyed, () => {
            this._client.sessions.delete(this._guild.id);
        })
    }

    private handleSessionEnd() {
        this._player.stop();
        this._connection.destroy();  
    }
}