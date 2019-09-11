import { spawn } from 'child_process';
import * as url from 'url';

export async function getClusteredImages(frames) {
  const positions = await runMDSClustering(frames);
  return frames.map((f, i) =>
    Object.assign({}, f, {
      x: positions[i].x,
      y: positions[i].y,
    })
  );
}

function runMDSClustering(frames) {
  return new Promise(resolve => {
    const python = spawn('python3', [
      './src/python_scripts/mds/run.py',
      '-i',
      ...frames.map(f => url.fileURLToPath(f.src)),
    ]);
    let output = '';
    python.stdout.on('data', data => {
      output += data.toString();
    });
    python.stderr.on('data', data => {
      console.log(data.toString());
    });
    python.on('close', () => {
      resolve(JSON.parse(output));
    });
  });
}
