import { exec } from 'child_process';

export function generateSummary(snippets, inputVideo, outputVideo) {
  let trims = '';
  let concat = '';

  for (const i in snippets) {
    let snippet = snippets[i];
    trims += `[0:v]trim=${snippet.start}:${snippet.end},setpts=PTS-STARTPTS[v${i}];`;
    trims += `[0:a]atrim=${snippet.start}:${snippet.end},asetpts=PTS-STARTPTS[a${i}];`;

    concat += `[v${i}][a${i}]`;
  }

  concat += `concat=n=${snippets.length}:v=1:a=1[v][a]`;

  let filter = `"${trims}${concat}"`;
  return new Promise((resolve, reject) => {
    exec(`ffmpeg -i ${inputVideo} -filter_complex ${filter} -map "[v]" -map "[a]" ${outputVideo} -y`, (err, out) => {
      if (err) {
        reject(err);
      } else {
        resolve(out);
      }
    });
  });
}
