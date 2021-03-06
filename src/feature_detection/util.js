import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { remote } from 'electron';

export const KEYFRAME_DIR = '.keyframes/';
export const FRAME_DIR = '.frames/';
export const SHOT_DIR = '.shots/';
export const CLIP_DIR = '.clips/';

export function createDirectory(directory) {
  fs.mkdirSync(getFullPath(directory));
}

export function removeDirectory(directory) {
  rimraf.sync(getFullPath(directory));
}

export function removeFile(file) {
  fs.unlinkSync(file);
}

export function readDirectory(directory) {
  const fullPath = getFullPath(directory);
  return fs.readdirSync(getFullPath(directory)).map(p => path.join(fullPath, p));
}

export function readFile(directory, filename) {
  const fullPath = getFullPath(directory, filename);
  return fs.readFileSync(fullPath, 'utf8');
}

export function getFullPath(directory, filename = '') {
  return path.join(remote.app.getPath('userData'), directory, filename);
}
