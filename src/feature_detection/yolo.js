import { spawn } from 'child_process';
import * as url from 'url';

import ObjectFrame from './object_frame';
import * as util from './util';

export async function detectObjects(path, fps) {
    util.removeDirectory(util.FRAME_DIR);
    util.createDirectory(util.FRAME_DIR);

    // todo: should have the ability to detect objects in keyframes, shots, and the whole video
    await generateFrames(path, util.getFullPath(util.FRAME_DIR), fps);
    let detectedObjects = await runObjectDetection(util.getFullPath(util.FRAME_DIR));

    return detectedObjects.map(o => {
        return new ObjectFrame(
            `${url.pathToFileURL(o.path)}?time=${Date.now()}`,
            o.objects
        );
    });
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
