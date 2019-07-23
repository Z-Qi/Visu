import { spawn } from 'child_process';

import * as util from './util'
import Keyframe from './keyframe';
import * as url from 'url';

export async function extractKeyframes(filePath, step, framerate) {
    util.removeDirectory(util.KEYFRAME_DIR);

    await runKeyframeExtraction(filePath, step, util.getFullPath(util.KEYFRAME_DIR));

    const keyframePaths = util.readDirectory(util.KEYFRAME_DIR);

    return keyframePaths.map(path => {
        return new Keyframe(
            `${url.pathToFileURL(path)}?time=${Date.now()}`,
            parseInt(path.match(/\d+/)[0]) / framerate
        );
    });
}

function runKeyframeExtraction(filePath, step, keyframeDirectory) {
    return new Promise((resolve) => {
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