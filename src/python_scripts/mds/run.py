import argparse
import cv2
import numpy as np
import json
from sklearn.manifold import MDS
from pprint import pprint


parser = argparse.ArgumentParser()
parser.add_argument(
    '-i',
    '--input_frames',
    nargs='+',
    type=str,
    required=True,
    help='A list of frames to cluster.'
)
args = parser.parse_args()
args.input_frames = sorted(args.input_frames)

N = len(args.input_frames)

histograms = []

for frame in args.input_frames:
    img = cv2.imread(frame)
    hist = cv2.calcHist(
        [img],
        [0, 1, 2],
        None,
        [8, 8, 8],
        [0, 256, 0, 256, 0, 256]
    )
    hist = cv2.normalize(hist, hist).flatten()
    histograms.append(hist)

distances = np.zeros((N, N))

for i in range(N):
    for j in range(N):
        distances[i][j] = cv2.compareHist(
            histograms[i],
            histograms[j],
            cv2.HISTCMP_HELLINGER
        )

mds = MDS(n_components=2, dissimilarity='precomputed', n_jobs=-1, max_iter=100)
transformed = mds.fit_transform(distances)

output = []
for i in range(N):
    output.append({
        'src': args.input_frames[i],
        'x': transformed[i][0],
        'y': transformed[i][1]
    })

print(json.dumps(output))
