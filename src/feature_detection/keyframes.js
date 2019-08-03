import { spawn } from 'child_process';
import * as url from 'url';

import * as util from './util';
import Keyframe from './keyframe';

export async function extractKeyframes(filePath, step, framerate) {
    util.removeDirectory(util.KEYFRAME_DIR);
    util.removeDirectory(util.SHOT_DIR);

    await runKeyframeExtraction(filePath, step, util.getFullPath(util.KEYFRAME_DIR));

    const keyframePaths = util.readDirectory(util.KEYFRAME_DIR);

    return keyframePaths.map(path => {
        return new Keyframe(
            `${url.pathToFileURL(path)}?time=${Date.now()}`,
            parseInt(path.match(/\d+/)[0]) / framerate
        );
    });
}

export function getShotBoundaryInfo() {
    const shotBounds = util.readFile(util.SHOT_DIR, 'shot_boundaries.json');
    return JSON.parse(shotBounds);
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