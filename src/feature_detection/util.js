import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { remote } from 'electron';

export const KEYFRAME_DIR = '.keyframes/';

export function createDirectory(directory) {
    fs.mkdirSync(getFullPath(directory));
}

export function removeDirectory(directory) {
    rimraf.sync(getFullPath(directory));
}

export function readDirectory(directory) {
    const fullPath = getFullPath(directory);
    return fs.readdirSync(getFullPath(directory)).map(p => path.join(fullPath, p));
}

export function getFullPath(directory) {
    return path.join(
        remote.app.getPath('userData'),
        directory
    );
}
