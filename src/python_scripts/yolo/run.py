from pydarknet import Detector, Image
from pprint import pprint
import json
import cv2
import time
import argparse
import os
import fileinput

current_dir = os.path.dirname(os.path.realpath(__file__))

config_file = os.path.join(current_dir, 'cfg/yolov3.cfg')
weights_file = os.path.join(current_dir, 'weights/yolov3.weights')
data_file = os.path.join(current_dir, 'cfg/coco.data')

# fix path to names file
for line in fileinput.input(data_file, inplace=True):
    if line.startswith('names = '):
        print(f'names = {os.path.join(current_dir, "data/coco.names")}')
    else:
        print(line, end='')

parser = argparse.ArgumentParser()
parser.add_argument(
    '-i',
    '--input_dir',
    type=str,
    required=True,
    help='The directory to source video frames from.'
)

args = parser.parse_args()

net = Detector(
    bytes(config_file, 'utf-8'),
    bytes(weights_file, 'utf-8'),
    0,
    bytes(data_file, 'utf-8')
)

detected_info = []

t1 = time.perf_counter()

for frame_name in sorted(os.listdir(args.input_dir)):
    frame_path = os.path.join(args.input_dir, frame_name)
    img = Image(cv2.imread(frame_path))
    results = net.detect(img)

    frame_info = {
        'path': frame_path,
        'objects': []
    }

    for label, _, _ in results:
        frame_info['objects'].append(label.decode('utf-8'))

    detected_info.append(frame_info)

print(json.dumps(detected_info))
