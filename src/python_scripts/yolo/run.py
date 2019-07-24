from pydarknet import Detector, Image
from pprint import pprint
import json
import cv2
import time
import argparse
import os
import fileinput
import sys

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

font_scale = 0.8
font_thickness = 1
# BGR
box_color = (0, 255, 0)
box_thickness = 2
label_color = (0, 0, 0)

for frame_name in sorted(os.listdir(args.input_dir)):
    frame_path = os.path.join(args.input_dir, frame_name)
    img = cv2.imread(frame_path)
    img_darknet = Image(img)
    results = net.detect(img_darknet)

    frame_info = {
        'path': frame_path,
        'objects': set()
    }

    for label, score, bounds in results:
        x, y, w, h = map(int, bounds)
        label_str = label.decode('utf-8')
        
        # outer box
        cv2.rectangle(img, (x - w // 2, y - h // 2), (x + w // 2, y + h // 2), box_color, box_thickness)
        
        # label
        (label_w, label_h), baseline = cv2.getTextSize(label_str, cv2.FONT_HERSHEY_DUPLEX, font_scale, font_thickness)
        cv2.rectangle(img, (x - w // 2 - box_thickness // 2, y - h // 2 - label_h - baseline), (x - w // 2 + label_w, y - h // 2), box_color, cv2.FILLED)
        cv2.putText(img, label_str, (x - w // 2, y - h // 2 - baseline), cv2.FONT_HERSHEY_DUPLEX, font_scale, label_color, font_thickness)

        cv2.imwrite(frame_path, img)
        
        frame_info['objects'].add(label.decode('utf-8'))
        
    frame_info['objects'] = list(frame_info['objects'])
    detected_info.append(frame_info)

print(json.dumps(detected_info))
