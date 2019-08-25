import { spawn } from 'child_process';
import * as url from 'url';

import * as util from './util';
import Frame from './frame';

export async function extractKeyframes(video, step) {
  util.removeDirectory(util.FRAME_DIR);
  util.removeDirectory(util.SHOT_DIR);

  await runKeyframeExtraction(
    video.path,
    step,
    util.getFullPath(util.FRAME_DIR)
  );

  const keyframePaths = util.readDirectory(util.FRAME_DIR);

  return keyframePaths.map(path => {
    return new Frame(
      `${url.pathToFileURL(path)}?time=${Date.now()}`,
      parseInt(path.match(/\d+/)[0]) / video.framerate
    );
  });
}

export function getShotBoundaryInfo() {
  const shotBounds = util.readFile(util.SHOT_DIR, 'shot_boundaries.json');
  return JSON.parse(shotBounds);
}

function runKeyframeExtraction(filePath, step, keyframeDirectory) {
  return new Promise(resolve => {
    let python = spawn('python3', [
      './src/python_scripts/hecate/run.py',
      '-i',
      filePath,
      '-s',
      step,
      '-k',
      keyframeDirectory,
    ]);
    python.stdout.on('data', data => {
      console.log(data.toString());
    });
    python.stderr.on('data', data => {
      console.log(data.toString());
    });
    python.on('exit', (code, signal) => {
      resolve();
    });
  });
}
