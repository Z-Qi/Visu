export default class Frame {
  constructor(src, timestamp, frameNumber, objects, objectSrc) {
    this.src = src;
    this.timestamp = timestamp;
    this.frameNumber = frameNumber;
    this.objects = objects;
    this.objectSrc = objectSrc;
  }
}
