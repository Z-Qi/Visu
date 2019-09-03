import { exec } from 'child_process';

export async function generateSummary(cuts, inputVideo, outputVideo) {
  let trims = '';
  let concat = '';

  for (const i in cuts) {
    let cut = cuts[i];
    trims += `[0:v]trim=${cut.start}:${cut.end},setpts=PTS-STARTPTS[v${i}];`;
    trims += `[0:a]atrim=${cut.start}:${cut.end},asetpts=PTS-STARTPTS[a${i}];`;

    concat += `[v${i}][a${i}]`;
  }

  concat += `concat=n=${cuts.length}:v=1:a=1[v][a]`;

  let filter = `"${trims}${concat}"`;

  exec(`ffmpeg -i ${inputVideo} -filter_complex ${filter} -map "[v]" -map "[a]" ${outputVideo} -y`, (err, out) => {
    if (err) {
      console.log(err);
    } else {
      console.log(out);
    }
  });
}
