FLAIRS2014
==========

Code used for FLAIRS 2014 conference paper

BML-Rules Simulation folder contains the code to run the scene in either baseline or rules-applied mode and generate log files.

Utilizing jsGameSoup for UI components and Node.js for processing, with natural, socket.io, and xml2js modules, and with javascript and HTML front-end. Install jsGameSoup install node.js npm natural npm socket.io npm xml2js

In main.js, change line: var BML = false; to true if you want to use the BML baseline file, false if you want to use the natural language processing of the actual play-script.

    InputFile.txt ==> Hand-mapped BML code with some "triggers" for coinciding movements based on the 1964 Hamlet video
    InputScript.txt ==> Play-script from 1964 Hamlet video in natural language and formatted to play-script standards
To run: start python for page hosting python -m SimpleHTTPServer 8888 start NodeJS module by running node server Then, open index.html file to begin running the scene and logging the character traces. http://localhost:8888/index.html

Sample output files are in the logs/bmllogs and logs/ruleslogs Rules include:

looking where someone is pointing
looking at speaker
not upstaging higher importance characters
look at what picking up
move to what want to pick up
see paper for full details

To run: start python for page hosting python -m SimpleHTTPServer 8888 Then, open chartraces.html file to begin running the scene and logging the character traces. http://localhost:8888/chartraces.html Enter the filename that exists in both the bmllogs/ and ruleslogs/ folders for the character you want to compare gaze direction or position for. Then, click the button

Forces Simulation folder contains the code to run the scene while applying forces to the characters and generate log files. 

To change the randomness of the human, modify the ACCURACY variable to the % accuracy desired.
To change which character is acting like the human, change the HUMAN variable to the name of the character to use as the human character.
