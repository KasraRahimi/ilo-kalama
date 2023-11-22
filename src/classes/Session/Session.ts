import { AudioPlayer, AudioPlayerStatus, VoiceConnection, createAudioPlayer, createAudioResource, joinVoiceChannel } from '@discordjs/voice';
import { Channel, Guild, TextBasedChannel, VoiceBasedChannel } from 'discord.js';
import { YouTubeVideo } from 'play-dl';
import play from 'play-dl';

const TIMEOUT = 30_000;

export class Session {
    private readonly _guild: Guild;
    private _currentVideo: YouTubeVideo | null;
    private _connection: VoiceConnection;
    private _player: AudioPlayer;
    private _timeout: NodeJS.Timeout | undefined;
    _textChannel: TextBasedChannel;

    constructor(guild: Guild, textChannel: TextBasedChannel, vc: VoiceBasedChannel) {
        this._guild = guild;
        this._textChannel = textChannel;
        this._currentVideo = null;

        this._connection = this.getConnection(vc.id);
        this._player = createAudioPlayer();
        this._connection.subscribe(this._player);
        this.setPlayerEvents();
    }

    setVideo(video: YouTubeVideo) {
        this._currentVideo = video;
    }

    async play() {
        if (this._currentVideo === null) return;
        const stream = await play.stream(this._currentVideo.url);
        const resource = createAudioResource(stream.stream, { inputType: stream.type });
        this._player.play(resource);
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
        this._player.on(AudioPlayerStatus.Idle, () => {
            this._textChannel.send('Done playing audio. Leaving voice channel soon.');
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

    private handleSessionEnd() {
        this._player.stop();
        this._connection.destroy();    
    }
}