import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { spawn } from 'child_process';
import { remote } from 'electron';

export async function extractKeyframes(filePath, step) {
    const keyframeDirectory = path.join(remote.app.getPath('userData'), '.keyframes/');

    rimraf.sync(keyframeDirectory);
    fs.mkdirSync(keyframeDirectory);

    await runKeyframeExtraction(filePath, step, keyframeDirectory);

    return keyframeDirectory;
}

function runKeyframeExtraction(filePath, step, keyframeDirectory) {
    return new Promise((resolve, reject) => {
        let python = spawn(
            'python3',
            [
                './src/python_scripts/hecate/run.py',
                '-i',
                filePath,
                '-s',
                step,
                '-k',
                keyframeDirectory
            ]
        );
        python.stdout.on('data', data => {
            console.log(data.toString());
        });
        python.stderr.on('data', data => {
            console.log(data.toString());
        })
        python.on('exit', (code, signal) => {
            resolve();
        });
    });
}