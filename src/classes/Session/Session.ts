import { AudioPlayer, AudioPlayerStatus, VoiceConnection, VoiceConnectionStatus, createAudioPlayer, createAudioResource, joinVoiceChannel } from '@discordjs/voice';
import { Ilo } from '@src/Ilo';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Guild, Message, TextBasedChannel, VoiceBasedChannel } from 'discord.js';
import { YouTubeVideo } from 'play-dl';
import play from 'play-dl';

const TIMEOUT = 30_000;

export class Session {
    private readonly _guild: Guild;
    private _currentIndex: number = 0;
    private _queue: YouTubeVideo[] = [];
    private _connection: VoiceConnection;
    private _player: AudioPlayer;
    private _timeout: NodeJS.Timeout | undefined;
    private _client: Ilo;
    private _nowPlayingMessage: Message | undefined
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
        this._nowPlayingMessage = await this._textChannel.send(`Now playing: ${this.currentVideo.title}`);
        this.placeButtonsOnNowPlayingMessage();
        this.listenToButtons();
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

    private placeButtonsOnNowPlayingMessage() {
        if (!this._nowPlayingMessage) return;
        const pause = new ButtonBuilder()
            .setCustomId('pause')
            .setLabel('⏸️')
            .setStyle(ButtonStyle.Primary);
        
        const resume = new ButtonBuilder()
            .setCustomId('resume')
            .setLabel('▶️')
            .setStyle(ButtonStyle.Success);
        
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(pause, resume);

        this._nowPlayingMessage.edit({ components: [row] });
    }

    private listenToButtons(iteration: number = 0) {
        if (!this._nowPlayingMessage) return;
        
        const FIFTEEN_MINUTES_IN_S = 15;
        const FIFTEEN_MINUTES_IN_MS = FIFTEEN_MINUTES_IN_S * 1000;

        let timeOut = this.currentVideo.durationInSec * 1000;

        if (this.currentVideo.durationInSec > FIFTEEN_MINUTES_IN_S) {
            const timeleft = this.currentVideo.durationInSec - FIFTEEN_MINUTES_IN_S * iteration;
            if (timeleft > FIFTEEN_MINUTES_IN_S) {
                timeOut = FIFTEEN_MINUTES_IN_MS;
            } else {
                timeOut = timeleft * 1000;
            }
        }

        // const timeOut = this.currentVideo.durationInSec < 15 * 60 ? this.currentVideo.durationInSec * 1000 : 15 * 60 * 1000;
    
        const collector = this._nowPlayingMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: timeOut });
        collector.on('collect', async (i) => {
            if (i.customId === 'pause') {
                this.pause();
                await i.reply({ content: 'Paused', ephemeral: true });
            } else if (i.customId === 'resume') {
                this.resume();
                await i.reply({ content: 'Resumed', ephemeral: true });
            }
        });
        collector.on('end', async (collected, reason) => {
            if (timeOut === FIFTEEN_MINUTES_IN_MS) {
                this.placeButtonsOnNowPlayingMessage();
                this.listenToButtons(iteration + 1);
            }
        });
    }

    private clearButtons() {
        if (!this._nowPlayingMessage) return;
        this._nowPlayingMessage.edit({ components: [] });
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
            this.clearButtons();
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
            this.clearButtons();
            this._textChannel.send('Leaving voice channel');
            this._client.sessions.delete(this._guild.id);
        })
    }
}
