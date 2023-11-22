import ytdl from 'ytdl-core';
import { Readable } from 'stream';

export class Video {
    private _title: string;
    private _url: string;
    private _duration: number;

    constructor(title: string, url: string, duration: number) {
        this._title = title;
        this._url = url;
        this._duration = duration;
    }

    get title(): string {
        return this._title;
    }

    get url(): string {
        return this._url;
    }

    get duration(): number {
        return this._duration;
    }

    get durationString(): string {
        const hours = Math.floor(this._duration / 3600);
        const minutes = Math.floor(this._duration % 3600 / 60);
        const seconds = Math.floor(this._duration % 3600 % 60);

        const secStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
        if (hours === 0) {
            return `${minutes}:${secStr}`;
        }
        const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
        return `${minStr}:${secStr}`;
    }

    async getAudio(): Promise<Readable> {
        return await ytdl(this._url, { filter: 'audioonly' });
    }
}