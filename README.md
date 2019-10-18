# Visu
Editing tool built with automatic video analysis and visualisations of video features.

## Installation Steps
The following installation steps were verified on Ubuntu 18.04. It is assumed that you have Python 3 installed, and it can be accessed via the `python3` command.

1. `npm install`
2. Run the following commands to install FFmpeg 4
   1. `sudo add-apt-repository ppa:jonathonf/ffmpeg-4`
   2. `sudo apt-get update`
   3. `sudo apt-get install ffmpeg`
3. `sudo apt-get install libavcodec-dev libavformat-dev libavdevice-dev`
4. Run the following commands to install CUDA
   1. `sudo add-apt-repository ppa:graphics-drivers/ppa`
   2. `sudo apt update`
   3. `sudo ubuntu-drivers autoinstall`
   4. Reboot your machine
   5. `sudo apt install nvidia-cuda-toolkit gcc-6`
   6. Verify your CUDA install by running `nvcc --version`
5. Run `sudo apt install python3-pip` (if you don’t have `pip3` installed already)
6. Run the following commands to install required packages
   1. `cd src/python/scripts/mds/`
   2. `pip3 install -r requirements.txt`
   3. `cd ../yolo/`
   4. `pip3 install -r requirements.txt`
   5. `wget https://pjreddie.com/media/files/yolov3.weights`
   6. `mv yolov3.weights weights/`
   7. `cd ../hecate`
7. Download [OpenCV 3.4.7](https://github.com/opencv/opencv/archive/3.4.7.zip)
8. Extract the above zip file and navigate to it in a new terminal
9. Run the following commands to install OpenCV
   1.  `mkdir build/`
   2.  `cd build/`
   3.  `cmake -D CMAKE_BUILD_TYPE=Release -D CMAKE_INSTALL_PREFIX=/usr/local ..`
   4.  `make -j8`
   5.  `sudo make install`
   6.  `sudo ldconfig`
10. Close this new terminal and go to your first terminal (should currently be inside the `src/python_scripts/hecate/` folder)
11. Run the following commands to install [hecate](https://github.com/yahoo/hecate)
    1.  `git clone https://github.com/yahoo/hecate.git`
    2.  `cd hecate/`
    3.  `make all`
    4.  `make distribute`
    5.  `mv distribute/ ..`
    6.  `cd ..`
    7.  `rm -rf hecate/`
    8.  Verify that hecate installed correctly by running `./distribute/bin/hecate`
12. Run `cd ../../../`
13. Finally, run `npm run electron:serve` to start up Visu
