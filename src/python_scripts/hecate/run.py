import argparse
import subprocess
import json
import os
import re
import shutil

current_dir = os.path.dirname(os.path.realpath(__file__))
hecate_path = os.path.join(current_dir, 'distribute/bin/hecate')

parser = argparse.ArgumentParser()
parser.add_argument(
    '-i',
    '--input',
    type=str,
    required=True,
    help='The input video file.'
)

parser.add_argument(
    '-s',
    '--step',
    type=int,
    required=True,
    help='The frame subsampling step size'
)

parser.add_argument(
    '-k',
    '--keyframe_dir',
    type=str,
    required=True,
    help='The directory to store the keyframes in.'
)

args = parser.parse_args()

shutil.rmtree(args.keyframe_dir, ignore_errors=True)
os.mkdir(args.keyframe_dir)

hecate_result = subprocess.run(
    [
        hecate_path,
        '-i',
        args.input,
        '--print_shot_info',
        '--print_keyfrm_info',
        '-s',
        str(args.step)
    ],
    stdout=subprocess.PIPE,
    encoding='utf-8'
).stdout

keyframes = list(
    map(
        lambda f: int(f) * args.step,
        re.search('(?<=keyframes: \\[).+(?=\\])',
                  hecate_result).group().split(',')
    )
)

# shot_boundaries = {
#     'boundaries': list(
#         map(
#             lambda boundary: { 'start': int(boundary[0]), 'end': int(boundary[1]) },
#             map(
#                 lambda shot: re.sub('[\[\]]', '', shot).split(':'),
#                     re.search('(?<=shots: ).+', hecate_result).group().split(',')
#             )
#         )
#     )
# }

# shots_dir = args.keyframe_dir.replace('keyframes', 'shots')

# os.mkdir(shots_dir)

# f = open(os.path.join(shots_dir, 'shot_boundaries.json'), 'x')
# f.write(json.dumps(shot_boundaries))
# f.close()

ffmpeg_frame_str = ''
for frame in keyframes:
    ffmpeg_frame_str += f'eq(n\\,{frame})+'

ffmpeg_frame_str = ffmpeg_frame_str[:-1]

subprocess.run(
    [
        'ffmpeg',
        '-i',
        args.input,
        '-vf',
        f"select='{ffmpeg_frame_str}'",
        '-vsync',
        '0',
        '-frame_pts',
        '1',
        os.path.join(args.keyframe_dir, 'frame_%6d.jpg')
    ]
)
