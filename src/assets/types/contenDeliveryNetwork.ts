import path from 'path';
import { existsSync } from 'fs';

export class ContentDeliveryNetwork {
  private readonly rootPath: string;

  constructor() {
    this.rootPath = 'cdn/';
  }

  public getObject(filePath: string) {
    let objectPath: string = '';

    if (this.isImage(filePath)) {
      objectPath = path.join(this.rootPath, 'image', filePath);
    } else if (this.isVideo(filePath)) {
      objectPath = path.join(this.rootPath, 'video', filePath);
    } else if (this.isAudio(filePath)) {
      objectPath = path.join(this.rootPath, 'audio', filePath);
    } else {
      objectPath = path.join(this.rootPath, 'other', filePath);
    }

    if (!objectPath || !existsSync(objectPath)) {
      return null;
    } else {
      return objectPath;
    }
  }

  public isImage(filePath: string) {
    const extension = path.extname(filePath).slice(1);
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension);
  }

  public isVideo(filePath: string) {
    const extension = path.extname(filePath).slice(1);
    return ['mp4', 'webm', 'ogg'].includes(extension);
  }

  public isAudio(filePath: string) {
    const extension = path.extname(filePath).slice(1);
    return ['mp3', 'wav', 'ogg'].includes(extension);
  }
}
