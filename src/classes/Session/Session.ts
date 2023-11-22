import { AudioPlayer, VoiceConnection, createAudioPlayer, joinVoiceChannel } from '@discordjs/voice';
import { Video } from '@src/classes/Video/Video';
import { Channel, Guild, VoiceBasedChannel } from 'discord.js';

const TIMEOUT = 30_000;

export class Session {
    private readonly _guild: Guild;
    private _currentVideo: Video | null;
    private _connection: VoiceConnection;
    private _player: AudioPlayer;
    _textChannel: Channel;

    constructor(guild: Guild, textChannel: Channel, vc: VoiceBasedChannel) {
        this._guild = guild;
        this._textChannel = textChannel;
        this._currentVideo = null;

        this._connection = this.getConnection(vc.id);
        this._player = createAudioPlayer();
    }

    private getConnection(channelId: string): VoiceConnection {
        const adapterCreator = this._guild.voiceAdapterCreator;
        return joinVoiceChannel({
            channelId: channelId,
            guildId: this._guild.id,
            adapterCreator: adapterCreator
        });
    }


}