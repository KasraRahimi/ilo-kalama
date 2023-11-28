import { AudioPlayer, AudioPlayerStatus, VoiceConnection, VoiceConnectionStatus, createAudioPlayer, createAudioResource, joinVoiceChannel } from '@discordjs/voice';
import { Ilo } from '@src/Ilo';
import { Guild, TextBasedChannel, VoiceBasedChannel } from 'discord.js';
import { YouTubeVideo } from 'play-dl';
import play from 'play-dl';

const TIMEOUT = 3_000;

export class Session {
    private readonly _guild: Guild;
    private _currentIndex: number = 0;
    private _queue: YouTubeVideo[] = [];
    private _connection: VoiceConnection;
    private _player: AudioPlayer;
    private _timeout: NodeJS.Timeout | undefined;
    private _client: Ilo;
    _textChannel: TextBasedChannel;

    constructor(guild: Guild, textChannel: TextBasedChannel, vc: VoiceBasedChannel, client: Ilo) {
        this._guild = guild;
        this._textChannel = textChannel;
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
        return this.queue[this._currentIndex];
    }

    get currentIndex() {
        return this._currentIndex;
    }

    async addToQueue(video: YouTubeVideo) {
        const shouldPlay = this.currentVideo ? false : true;
        this._queue.push(video);
        if (shouldPlay) await this.play();
    };

    async playNext() {
        if (this._currentIndex < this._queue.length) {
            this._currentIndex++;
            await this.play();
        }
    }

    async play() {
        if (this._currentIndex === this._queue.length) return;
        this._textChannel.send(`Now playing: ${this.currentVideo.title}`);
        const stream = await play.stream(this.currentVideo.url);
        const resource = createAudioResource(stream.stream, { inputType: stream.type });
        this._player.play(resource);
    }

    async seek(seconds: number) {
        if (this.currentVideo === null) return;
        const stream = await play.stream(this.currentVideo.url, { seek: seconds });
        const resource = createAudioResource(stream.stream, { inputType: stream.type });
        this._player.play(resource);
    }

    pause() {
        this._player.pause();
    }

    resume() {
        this._player.unpause();
    }

    handleSessionEnd() {
        this._player.stop();
        this._connection.destroy();  
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
            if (this.currentVideo) return;
            this._textChannel.send('Playback is over. Leaving voice channel in 30 seconds');
            this._timeout = setTimeout(() => {
                this.handleSessionEnd();
            }, TIMEOUT);
        });
        // Handle Playing state
        this._player.on(AudioPlayerStatus.Playing, () => {
            if (this._timeout) {
	            clearTimeout(this._timeout);	
		        return;
	        }
        });
    }

    private setConnectionEvents() {
        this._connection.on('error', error => {
            console.error(error);
            this._textChannel.send('There was an error while playing audio.');
        });
        this._connection.on(VoiceConnectionStatus.Destroyed, () => {
            this._textChannel.send('Leaving voice channel');
            this._client.sessions.delete(this._guild.id);
        })
    }
}
