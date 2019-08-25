import { spawn } from 'child_process';
import * as url from 'url';

export async function detectObjectsInFrames(frames) {
  const detectedObjects = await runObjectDetection(frames);
  return frames.map((f, i) => Object.assign({}, f, detectedObjects[i]));
}

function runObjectDetection(frames) {
  return new Promise(resolve => {
    let python = spawn('python3', [
      './src/python_scripts/yolo/run.py',
      '-i',
      ...frames.map(f => url.fileURLToPath(f.src)),
    ]);
    python.stdout.on('data', data => {
      resolve(JSON.parse(data.toString()));
    });
    python.stderr.on('data', data => {
      // yolo prints to stderr
      console.log(data.toString());
    });
  });
}
