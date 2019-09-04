import { spawn } from 'child_process';
import * as url from 'url';

export async function detectObjectsInFrames(frames) {
  const detectedObjects = await runObjectDetection(frames);
  return frames.map((f, i) =>
    Object.assign({}, f, {
      objects: detectedObjects[i].objects,
      objectSrc: `${url.pathToFileURL(detectedObjects[i].objectSrc)}?time=${Date.now()}`,
    })
  );
}

function runObjectDetection(frames) {
  return new Promise(resolve => {
    const python = spawn('python3', [
      './src/python_scripts/yolo/run.py',
      '-i',
      ...frames.map(f => url.fileURLToPath(f.src)),
    ]);
    let output = '';
    python.stdout.on('data', data => {
      output += data.toString();
    });
    python.stderr.on('data', data => {
      // yolo prints to stderr
      console.log(data.toString());
    });
    python.on('close', () => {
      resolve(JSON.parse(output));
    });
  });
}
