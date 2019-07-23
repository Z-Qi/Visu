import * as fs from 'fs';
import * as rimraf from 'rimraf';
import { spawn } from 'child_process';

export async function detectObjects(path, fps) {
    const frameDirectory = './.frames/';

    rimraf.sync(frameDirectory);
    fs.mkdirSync(frameDirectory);

    await generateFrames(path, frameDirectory, fps);
    let detectedObjects = await runObjectDetection(frameDirectory);

    rimraf.sync(frameDirectory);

    return detectedObjects;
}

function runObjectDetection(frameDirectory) {
    return new Promise((resolve, reject) => {
        let python = spawn(
            'python3',
            [
                './src/python_scripts/yolo/run.py',
                '-i',
                frameDirectory,
            ]
        );
        python.stdout.on('data', data => {
            resolve(JSON.parse(data.toString()));
        });
        python.stderr.on('data', data => {
            // yolo prints to stderr
            console.log(data.toString());
        });
    });
}

function generateFrames(path, frameDirectory, fps) {
    return new Promise((resolve, reject) => {
        let ffmpeg = spawn(
            'ffmpeg',
            [
                '-i',
                path,
                '-vf',
                `fps=${fps}`,
                `${frameDirectory}frame%04d.jpg`,
                '-hide_banner'
            ]
        );
        ffmpeg.on('exit', (code, signal) => {
            resolve();
        });
        ffmpeg.stderr.on('data', data => {
            console.log(data.toString());
        });
    });
}
