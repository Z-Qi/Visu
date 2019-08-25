import { spawn } from 'child_process';
import {
  readDirectory,
  getFullPath,
  createDirectory,
  removeDirectory,
} from '../feature_detection/util';
import { pathToFileURL } from 'url';
import Frame from '../feature_detection/frame';

export async function extractFrames(video, frameDirectory, step) {
  removeDirectory(frameDirectory);
  createDirectory(frameDirectory);

  const promise = new Promise(resolve => {
    const ffmpeg = spawn('ffmpeg', [
      '-i',
      video.path,
      '-vf',
      `select='not(mod(n\,${step}))'`,
      '-vsync',
      '0',
      '-q:v',
      '2',
      '-frame_pts',
      '1',
      getFullPath(frameDirectory, 'frame_%6d.jpg'),
    ]);
    ffmpeg.on('exit', code => {
      // todo: handle non-zero exit code
      resolve();
    });
    ffmpeg.stderr.on('data', data => {
      console.log(data.toString());
    });
  });

  await promise;

  const framePaths = readDirectory(frameDirectory);

  return framePaths.map(p => {
    return new Frame(
      `${pathToFileURL(p)}?time=${Date.now()}`,
      parseInt(p.match(/\d+/)[0]) / video.framerate
    );
  });
}
