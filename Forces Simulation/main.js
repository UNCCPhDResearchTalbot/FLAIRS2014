var BML = false;
var USE_FORCES = true;
var HUMAN = "GRAVEDIGGER1";
var ACCURACY = .1;
// to switch between BML and natural language processing
var server = require('./server');
var forces = require('./forces');
var fs = require('fs');
var traceback = require('./node_modules/traceback/traceback');
//var eyes = require('eyes');
var xml2js = require('xml2js');
var natural = require('natural');
var wordnet = new natural.WordNet('.');
var tokenizer = new natural.WordTokenizer();
var verbInflector = new natural.PresentVerbInflector();

var honstagenomvmt = 0;
var charintarcharcharnomvmt = 0;
var addchartarget = 0;
var charonstagenomvmt = 0;
var randomcounter = 0;

var MAXXVAL = 1059;
var MAXYVAL = 916;
var MAXXCONVERTED = (-2 * MAXXVAL) + 2312;
var MAXYCONVERTED = (2 * MAXYVAL) + 209;

var INTERVAL_ID = null;
var framerate = 1000 / 60;
var TIMEOUTS = new Array();
var characters = null;
var pawns = null;
var allObjects = null;
var WAITINGON = new Array();
var WAITING = false;
var FORCEWAIT = new Array();
var FORCEWAITING = false;
var inputFileName = "InputFile.txt";
var inputFile = null;
var ALLDATA = new Array();
var curLine = 0;
var curMsg = 0;
var charContext = null;
var prevCharContext = null;
var numcalls = 0;
var mvmtlines = null;
var mytype = null;
var myctr = null;

var QUEUED = new Array();
var QUEUEDTEXT = new Array();

var charprecedence = ["HAMLET", "GRAVEDIGGER1", "GRAVEDIGGER2", "HORATIO"];

var locationarray = ["CENTER", "GRAVE", "BACK", "LEDGE", "PICK", "LANTERN", "UPSTAGE", "DOWNSTAGE", "DOOR", "SHOVEL", "SPADE", "FORWARD", "BACKWARD", "STAGELEFT", "STAGERIGHT", "RIGHT", "CENTERBACKSTAGE", "AUDIENCE", "SKULL", "LEFT", "BARRICADE", "STEPS", "STOOL", "COIN", "POCKET", "IT", "CENTERRIGHT"];
var translatedlocationarray = ["CENTER", "GRAVE", "/BACK", "GRAVE", "SHOVEL", "LANTERN", "UPSTAGE", "DOWNSTAGE", "CENTERBACKSTAGE", "SHOVEL", "SHOVEL", "/FORWARD", "/BACK", "STAGELEFT", "STAGERIGHT", "/RIGHT", "CENTERBACKSTAGE", "AUDIENCE", "/SKULL", "/LEFT", "GRAVE", "STEPS", "STOOL", "/COIN", "/CURRENT", "/CURRENT", "CENTERRIGHT"];
var chararray = ["HAMLET", "HORATIO", "GRAVEDIGGER1", "GRAVEDIGGER2", "HE", "SHE", "WHO", "HIS"];
var translatedchararray = ["HAMLET", "HORATIO", "GRAVEDIGGER1", "GRAVEDIGGER2", "/CURRENT", "/CURRENT", "/CURRENT", "/CURRENT"];
var lookarray = ["LOOK", "TURN", "FACE", "GAZE", "LOOKS", "TO"];
var walkarray = ["WALK", "GO", "MOVE", "ENTER", "CROSS", "CROSSES", "STEP", "STEPS", "EXITS", "GOES", "BESIDE", "TO", "SITS", "ENTERS", "STANDS"];
var pointarray = ["POINT", "GESTURE"];
var pickuparray = ["PICK", "PICKUP", "LIFT", "PICK-UP", "CARRY", "CARRYING", "CARRIES", "WITH", "HOLDS", "PICKS", "GIVES"];
var putdownarray = ["PUT", "PLACE", "PUTDOWN", "PUT-DOWN", "SET", "TOSSES", "THROWS", "HANDS"];
var followarray = ["FOLLOW", "FOLLOWED", "FOLLOWING", "FOLLOWS"];
var handoffarray = ["HAND", "HANDS", "GIVES"];
var allarrays = [lookarray, walkarray, pointarray, pickuparray, putdownarray, followarray];

onerror = endSimulation();

(function() {
	Array.prototype.allIndexOf = function(searchElement) {
		if (this === null) {
			return [-1];
		}
		var len = this.length, hasIndexOf = Array.prototype.indexOf, // you know, because of IE
		i = (hasIndexOf) ? this.indexOf(searchElement) : 0, n, indx = 0, result = [];
		if (len === 0 || i === -1) {
			return [-1];
		}
		if (hasIndexOf) {
			// Array.indexOf does exist
			for ( n = 0; n <= len; n++) {
				i = this.indexOf(searchElement, indx);
				if (i !== -1) {
					indx = i + 1;
					result.push(i);
				} else {
					return result;
				}
			}
			return result;
		} else {
			// Array.indexOf doesn't exist
			for ( n = 0; n <= len; n++) {
				if (this[n] === searchElement) {
					result.push(n);
				}
			}
			return (result.length > 0) ? result : [-1];
		}
	};
})();

/**
 * This stops the game simulation because no one is playing anymore
 */
function endSimulation() {

	// end the simulation so can start new
	clearInterval(INTERVAL_ID);
	//var highestTimeoutId = setTimeout("");
	if (TIMEOUTS != null) {
		for (var i = 0; i < TIMEOUTS.length; i++) {
			clearTimeout(TIMEOUTS[i]);
		}
	}
	if (characters != null) {
		for (var i = 0; i < characters.length; i++) {
			if (characters[i].log != null) {
				characters[i].log.close();
			}
		}
	}
	for (var j = 0; j < WAITINGON.length; j++) {
		WAITINGON.splice(j, 1);
	}
	if (inputFile != null) {
		try {
			inputFile.close();
		} catch(e) {
			// do nothing, no big deal
		}
	}
	inputFile = null;
	ALLDATA = null;
	TIMEOUTS = null;
	WAITINGON = null;
}

function startGame() {
	characters = null;
	pawns = null;
	allObjects = null;
	TIMEOUTS = new Array();
	ALLDATA = new Array();
	mvmtlines = null;
	mytype = null;
	myctr = null;
	var textBoxes = null;
	curMsg = 0;
	charContext = null;
	prevCharContext = null;
	//	var speechBox = document.getElementById('text');
	//	var speakerBox = document.getElementById('speaker');
	var pointTime = 3000;
	var pickupTime = 1000;
	var characterSize = 26;
	var objectSize = 7;
	var lookatTime = 50;
	// how long to wait between turns - change to 50?
	var turnDist = 2 * Math.PI / 180 * 5;
	// 5 degrees per cycle, in radians
	var sayTime = 100;
	var moveDist = 2;
	var stepTime = 50;

	var logpath = "C:\\temp\\logfiles\\";
	WAITINGON = new Array();
	curLine = 0;
	WAITING = false;
	if (BML) {
		inputFileName = "InputFile.txt";
	} else {
		inputFileName = "InputScript.txt";
	}
	inputFile = fs.createReadStream(inputFileName, {
		'flags' : 'r',
		'encoding' : 'binary',
		'mode' : 0666,
		'bufferSize' : 4 * 1024
	});

	forces.fstartGame();

	/**
	 * This gathers all the information from all entities in the world into a string.
	 * @return {String} Placement information for all entities in the world
	 */
	function createUpdMsg(type, obj) {
		var msg = type;
		switch (type) {
			case "BOX":
				msg = msg + "\t" + textBoxes.who + "\t" + textBoxes.text;
				break;
			case "CHAR":
				if (obj.x != obj.xold || obj.y != obj.yold || obj.angle != obj.angleold || obj.pointTo != obj.pointToold || obj.pointAngle != obj.pointAngleold) {
					msg = msg + "\t" + obj.name + "\t" + obj.x + "\t" + obj.y + "\t" + obj.angle + "\t" + ((obj.pointTo == null) ? ("null") : (( obj instanceof Pawn) ? (obj.name) : (obj))) + "\t" + obj.pointAngle;
				}
				break;
			case "PAWN":
				if (obj.x != obj.xold || obj.y != obj.yold || obj.showcolor != obj.showcolorold) {
					msg = msg + "\t" + obj.name + "\t" + obj.x + "\t" + obj.y + "\t" + obj.showcolor;
				}
				break;
			default:
				msg = msg + "\t ERROR!";
				console.log("ERROR Creating upd msg");
				break;
		}
		if (msg != type) {
			server.sendMsg(msg);
		}
		//return msg;
	}

	/* this one just reads the flat file that has bml & markers saying what to do */
	function readyForNextMsg(msgnum) {

		var toremove = WAITINGON.indexOf(msgnum);
		if (toremove != -1) {
			WAITINGON.splice(toremove, 1);
		}
		if (WAITINGON.length == 0) {
			//console.log("done waiting for msgnum="+msgnum);
			WAITING = false;
		}
		if (!WAITING) {
			//console.log("done waiting for all, moving on");
			writeXYs();
			nextLine();
		}
		// do nothing if we're still waiting for other events to finish
	}

	/* #2 means going to use natural language to figure out next steps to do */

	function readyForNextMsg2(msgnum) {
		//console.log("Num calls="+numcalls+", msgnum="+msgnum);
		console.log("Removing msg#" + msgnum);
		//numcalls++;
		var toremove = WAITINGON.indexOf(msgnum);
		if (toremove != -1) {
			WAITINGON.splice(toremove, 1);
		}
		var mytext = "";
		for (var i = 0; i < WAITINGON.length; i++) {
			mytext = mytext + ", " + WAITINGON[i];
		}
		console.log("Left in list: " + mytext);
		if (WAITINGON.length == 0) {
			//console.log("done waiting for msgnum="+msgnum);
			WAITING = false;
		}
		if (!WAITING) {
			//console.log("done waiting for all, moving on");
			// saved everything into QUEUED array, now need to calculate forces to adjust what to do
			TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
				if (!WAITING) {
					console.log("READY TO EVALUATE FORCES!");
					evaluateforces();
				} // to avoid timing issues
			}, 30);
			//console.log("READY TO EVALUATE FORCES!");
			//evaluateforces();
			/*writeXYs();
			 parseLine();*/
		}
		// do nothing if we're still waiting for other events to finish
	}

	function doneWithForces(msgnum) {
		var toremove = FORCEWAIT.indexOf(msgnum);
		console.log("forces removing " + msgnum);
		if (toremove != -1) {
			FORCEWAIT.splice(toremove, 1);
		}
		var mytext = "";
		for (var i = 0; i < FORCEWAIT.length; i++) {
			mytext = mytext + ", " + FORCEWAIT[i];
		}
		console.log("Left in forces: " + mytext);
		if (FORCEWAIT.length == 0) {
			FORCEWAITING = false;
		}
		if (!FORCEWAITING) {
			TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
				if (!FORCEWAITING) {
					console.log("done waiting for forces");
					QUEUEDTEXT = new Array();
					QUEUED = new Array();
					writeXYs();
					parseLine();
				}
			}, 30);

		}

	}

	function evaluateforces() {
		// everything is in the QUEUED array - need to figure out who
		// QUEUEDTEXT has actor:, motion:, target:, otherstep: {actor:, motion:, target:}  where target: could be object, array, or x:,y:
		// motions include: locomotionTarget, pointAtPoint, pointAtTarget, pickup, putdown, makecharlook, locomotionPt, say

		// only need to review the locomotionTarget & locomotionPt entries for determining if adding to forces AND if in forces what the target is for that char
		// otherwise just verify current position for characters
		var TEMPQUEUE = new Array();
		var curcharname = "";
		for (var m = 0; m < QUEUEDTEXT.length; m++) {
			switch (QUEUEDTEXT[m].motion) {
				case 'locomotionTarget':
				case 'locomotionPt':
					TEMPQUEUE[TEMPQUEUE.length] = QUEUEDTEXT[m];
					break;
				default:
					break;
			}
		}
		for (var i = 0; i < characters.length; i++) {
			curcharname = characters[i].name;
			console.log("checking char " + curcharname);
			var inlist = false;
			var whichitem = -1;
			var actions = new Array();
			for (var j = 0; j < TEMPQUEUE.length; j++) {
				if (curcharname == TEMPQUEUE[j].actor.name) {// so only get the first one
					if (!inlist) {
						inlist = true;
						whichitem = j;
					}
					actions[actions.length] = TEMPQUEUE[j].motion;
				}
			}
			if (curcharname == HUMAN) {
				console.log("Is human");
				// for the human char - if slated to move in the queuedtext, then do this first:
				var myrand = Math.random();
				if (inlist && myrand >= ACCURACY && TEMPQUEUE[whichitem].motion == "locomotionPt") {
					// if this is the human, then do full movement if > accuracy, else do 50% of movement
					//var myrand = Math.random();
					//if (myrand >= ACCURACY) {
					// change my x & y!!
					randomcounter++;
					var myrandx = Math.random();
					var myrandy = Math.random();
					// change my x & y!!
					var x = MAXXVAL * myrandx;
					var y = MAXYVAL * myrandy;
					//x = MAXXCONVERTED*myrandx;
					//y = MAXYCONVERTED*myrandy;
					/*x = -1 * (x - 2312) / 2;
					// clean up point values
					y = (y - 209) / 2;
					x = (x+this.x)/2;
					y = (y+this.y)/2;*/
					////	targetAngle = Math.atan2(this.y - y, x - this.x) + Math.PI / 2;
					//Math.atan2(this.y - y, x - this.x) + Math.PI/2;
					// look in direction moving
					////this.angleold = this.angle;
					////this.angle = targetAngle;
					////this.moveTo = "Point " + x + "," + y;
					//var xthis = this;
					//this.turnSome(msgnum, 'M', targetAngle, function() {xthis.Step(msgnum, x, y, targetAngle, callbackFunc); xthis = null;});
					////console.log("going halfway to point:"+x+","+y);
					//this.Step(msgnum, x, y, targetAngle, callbackFunc);
					// find which one this is in the main queue & reset the x/y target value!!
					var kfound = false;
					for ( k = 0; k < QUEUEDTEXT.length; k++) {
						if (!kfound && curcharname == HUMAN && QUEUEDTEXT[k].motion == "locomotionPt") {
							QUEUEDTEXT[k].target[0] = x;
							QUEUEDTEXT[k].target[1] = y;
							kfound = true;
						}
					}
					console.log("HUMAN Pt greater accuracy " + x + "," + y);
					addchar(HUMAN, x, y);

					//}
				} else if (inlist && myrand >= ACCURACY && TEMPQUEUE[whichitem].motion == "locomotionTarget") {
					// if this is the human, then do full movement if > accuracy, else do 50% of movement
					randomcounter++;
					//if (myrand >= ACCURACY) {
					var myrandx = Math.random();
					var myrandy = Math.random();
					// change my x & y!!
					targetx = MAXXVAL * myrandx;
					targety = MAXYVAL * myrandy;
					//targetx = MAXXCONVERTED*myrandx;
					//targety = MAXYCONVERTED*myrandy;
					////targetAngle = Math.atan2(this.y - targety, targetx - this.x) + Math.PI / 2;
					////console.log("going halfway to target "+item.name+":"+targetx+","+targety+":"+targetAngle);
					// find which one this is in the main queue & reset the x/y target value!!
					var k2found = false;
					for ( k = 0; k < QUEUEDTEXT.length; k++) {
						if (!k2found && curcharname == HUMAN && QUEUEDTEXT[k].motion == "locomotionTarget") {
							QUEUEDTEXT[k].target[0] = targetx;
							QUEUEDTEXT[k].target[1] = targety;
							QUEUEDTEXT[k].motion = "locomotionPt";
							k2found = true;
						}
					}
					console.log("HUMAN Target greater accuracy " + targetx + "," + targety);
					addchar(HUMAN, targetx, targety);
					//}
			/*	} else if (inlist && myrand >= ACCURACY) {
					// give him somewhere to go
					randomcounter++;
					var myrandx = Math.random();
					var myrandy = Math.random();
					// change my x & y!!
					var x = MAXXVAL * myrandx;
					var y = MAXYVAL * myrandy;
					//QUEUEDTEXT has actor:, motion:, target:, otherstep: {actor:, motion:, target:}  where target: could be object, array, or x:,y:
					QUEUEDTEXT[QUEUEDTEXT.length] = {
						actor : characters[i],
						motion : "locomotionPt",
						target : {
							x : x,
							y : y
						}
					};
					console.log("HUMAN Pt greater accuracy " + x + "," + y);
					addchar(HUMAN, x, y);
*/
				} else {
					// human character not needing to do something random - so just check if onstage currently
					// if so, create human in forces
					if (inlist) {
						var result;
						if (TEMPQUEUE[whichitem].target instanceof Array) {
							result = cleanupxys(TEMPQUEUE[whichitem].target[0], TEMPQUEUE[whichitem].target[1]);
						} else {
							result = cleanupxys(TEMPQUEUE[whichitem].target.x, TEMPQUEUE[whichitem].target.y);
						}
						console.log("HUMAN inlist " + TEMPQUEUE[whichitem].target.x + "," + TEMPQUEUE[whichitem].target.y + " [" + result.x + "," + result.y + "]");

						if (TEMPQUEUE[whichitem].motion == "locomotionPt") {
							addchar(HUMAN, result.x, result.y);
						} else {
							addchar(HUMAN, TEMPQUEUE[whichitem].target.x, TEMPQUEUE[whichitem].target.y);
						}
					} else {
						if (characters[i].onstage()) {
							honstagenomvmt++;
							console.log("HUMAN not in list, but onstage " + honstagenomvmt + ":" + characters[i].x + "," + characters[i].y);
							addchar(HUMAN, characters[i].x, characters[i].y);
						} else {
							console.log("HUMAN not onstage");
						}
					}
				}

			} else {// not human character at all
				console.log("NOT human");
				if (inlist) {
					console.log("inlist NOT human");
					// might have more than one movement, but not likely - so going to assume only one motion
					// check if target for character is still onstage & if so, add char in forces
					if ((TEMPQUEUE[whichitem].target instanceof Character)) {// if my target is a character, check to see their target (if any) before adding character stuff
						console.log("inlist NOT human target is char");
						var charname = TEMPQUEUE[whichitem].target.name;
						var clist = false;
						var cwhich = -1;
						for (var l = 0; l < TEMPQUEUE.length; l++) {
							if (TEMPQUEUE[l].actor.name == charname) {
								if (!clist) {
									clist = true;
									cwhich = l;
								}
							}
						}
						if (clist) {
							var myres2 = cleanupxys(TEMPQUEUE[cwhich].target.x, TEMPQUEUE[cwhich].target.y);
							console.log("inlist NOT human target is char, and target in list");
							if (TEMPQUEUE[cwhich].target.x > MAXXVAL || TEMPQUEUE[cwhich].target.x < 0 || TEMPQUEUE[cwhich].target.y > MAXYVAL || TEMPQUEUE[cwhich].target.y < 0) {
								// offstage, so ignore
								console.log("inlist NOT human target is char, and target in list, but offstage:" + TEMPQUEUE[cwhich].target.name + "--" + myres2.x + "," + myres2.y);
							} else {
								console.log("char, inlist, target is char, char in list");
								addchar(curcharname, TEMPQUEUE[cwhich].target.x - 1, TEMPQUEUE[cwhich].target.y - 1);
								addchartarget++;
								console.log("adding target " + TEMPQUEUE[whichitem].target.name + "TARGET" + addchartarget);
								new forces.Unmoveables(TEMPQUEUE[whichitem].target.name + "TARGET", TEMPQUEUE[cwhich].target.x + 1, TEMPQUEUE[cwhich].target.y + 1, null);
								new forces.Link("target", TEMPQUEUE[whichitem].actor.name, TEMPQUEUE[whichitem].target.name + "TARGET", 5, 5);
							}
						} else {
							// use the character's current position & add to forces:
							charintarcharcharnomvmt++;
							console.log("char, inlist, target is char, char not in list" + charintarcharcharnomvmt);
							addchar(curcharname, TEMPQUEUE[whichitem].target.x + 1, TEMPQUEUE[whichitem].target.y + 1);
							addchartarget++;
							console.log("adding target2 " + TEMPQUEUE[whichitem].target.name + "TARGET" + addchartarget);
							new forces.Unmoveables(TEMPQUEUE[whichitem].target.name + "TARGET", TEMPQUEUE[whichitem].target.x - 1, TEMPQUEUE[whichitem].target.y - 1, null);
							new forces.Link("target", TEMPQUEUE[whichitem].actor.name, TEMPQUEUE[whichitem].target.name + "TARGET", 5, 5);
						}
					} else {
						var myres = cleanupxys(TEMPQUEUE[whichitem].target.x, TEMPQUEUE[whichitem].target.y);
						if ((myres.x > MAXXVAL || myres.x < 0 || myres.y > MAXYVAL || myres.y < 0)) {
							// offstage, so ignore
							console.log("inlist NOT human target is NOT char, but offstage:" + myres.x + "," + myres.y);
							console.log(TEMPQUEUE[whichitem].target);
						} else {
							var result;
							if (TEMPQUEUE[whichitem].target instanceof Array) {
								result = cleanupxys(TEMPQUEUE[whichitem].target[0], TEMPQUEUE[whichitem].target[1]);
							} else {
								result = cleanupxys(TEMPQUEUE[whichitem].target.x, TEMPQUEUE[whichitem].target.y);
							}
							if (TEMPQUEUE[whichitem].motion == "locomotionPt") {
								console.log("char, inlist, target NOT char, target onstage, motion to point:[" + TEMPQUEUE[whichitem].target.x + "," + TEMPQUEUE[whichitem].target.y + "] [" + result.x + "," + result.y + "]");
								addchar(curcharname, result.x, result.y);
							} else {
								console.log("char, inlist, target NOT char, target onstage, motion NOT to point");
								addchar(curcharname, TEMPQUEUE[whichitem].target.x - 2, TEMPQUEUE[whichitem].target.y - 2);
								//if (TEMPQUEUE[whichitem].motion == "locomotionTarget") {
								addchartarget++;
								console.log("adding target3 " + TEMPQUEUE[whichitem].target.name + "TARGET" + addchartarget);
								new forces.Unmoveables(TEMPQUEUE[whichitem].target.name, TEMPQUEUE[whichitem].target.x + 2, TEMPQUEUE[whichitem].target.y + 2, null);
								// adding marks to the stage if is an object or "mark"
								new forces.Link("target", TEMPQUEUE[whichitem].actor.name, TEMPQUEUE[whichitem].target.name, 5, 5);
							}
						}
					}

				} else {
					console.log("char, not inlist")
					// not in list, so just check if character is currently onstage & if so, add char in forces
					if (characters[i].x > 0 && characters[i].x < MAXXVAL && characters[i].y > 0 && characters[i].y < MAXYVAL) {
						charonstagenomvmt++;
						console.log("char, not in list, char onstage" + charonstagenomvmt);
						addchar(curcharname, characters[i].x, characters[i].y);
					} else {
						console.log(curcharname + "--char, not in list, not onstage");
					}
				}
			}
		}
		// all chars added to forces, so now need to recalculate forces, then update my QUEUED actions, then invoke them with timeouts & the FORCEWAIT array to call my doneWithForces function
		forces.recalculate();
		var myforces = forces.all();
		if (myforces == null) {
			console.log("No forces in all object");
		} else {
			console.log("All returned forces:");
			for (var x = 0; x < myforces.length; x++) {
				console.log(myforces[x].name + ":" + myforces[x].x + "," + myforces[x].y);
			}
			console.log("End of returned forces");
		}
		if (myforces != null) {
			for (var f = 0; f < myforces.length; f++) {
				// go through all people in the forces calculations & reset the QUEUED actions
				// if not in the qUEUED actions, add a new item to move them to the forces location if not where they currently are
				// use calledby for comparing names!!
				// change locomotionTarget to locomotionPt in actions!!
				if (myforces[f] instanceof forces.FCharacter) {//|| myforces[f] instanceof forces.Human) { // ignore immoveables!!
					var inflist = false;
					var whichfitem = -1;
					for (var q = 0; q < QUEUEDTEXT.length; q++) {
						if (myforces[f].calledby == QUEUEDTEXT[q].actor.name && (QUEUEDTEXT[q].motion == "locomotionTarget" || QUEUEDTEXT[q].motion == "locomotionPt")) {
							if (!inflist) {
								inflist = true;
								whichfitem = q;
							}
							if (myforces[f].x != QUEUEDTEXT[q].target.x || myforces[f].y != QUEUEDTEXT[q].target.y) {
								QUEUEDTEXT[q].motion = "locomotionPt";
								QUEUEDTEXT[q].target = {
									x : myforces[f].x,
									y : myforces[f].y
								};
							} // else keep what I have in case it is a locomotionTarget
						}
					}
					if (!inflist) {
						// add to QUEUE!
						// get index of character!!
						var myindex = 0;
						for (var c = 0; c < characters.length; c++) {
							if (characters[c].name == myforces[f].calledby) {
								myindex = c;
							}
						}
						QUEUEDTEXT[QUEUEDTEXT.length] = {
							actor : characters[myindex],
							motion : "locomotionPt",
							target : {
								x : myforces[f].x,
								y : myforces[f].y
							}
						};
					}
				}
			}
		}
		//curMsg++; // just to be sure to clear out the last message num!!
		for (var q = 0; q < QUEUEDTEXT.length; q++) {
			// go through queue and invoke all the saved methods using doneWithForces as the callback (unless there is otherstep, use otherstep as the callback with doenForces as its callback)
			// add msgnum to FORCEWAIT & set FORCEWAITING to true
			FORCEWAITING = true;
			FORCEWAIT[FORCEWAIT.length] = curMsg;

			var mycallbackfunction = "done";
			if (QUEUEDTEXT[q].otherstep == undefined || QUEUEDTEXT[q].otherstep == null) {
				// do nothing
			} else {
				mycallbackfunction = "other";

			}

			// QUEUEDTEXT has actor:, motion:, target:, otherstep: {actor:, motion:, target:}  where target: could be object, array, or x:,y:
			// motions include: locomotionTarget, pointAtPoint, pointAtTarget, pickup, putdown, makecharlook, locomotionPt, say

			switch (QUEUEDTEXT[q].motion) {
				case "locomotionPt":
					console.log("adding " + curMsg + " locomotionPt " + QUEUEDTEXT[q].actor.name + " to (" + QUEUEDTEXT[q].target.x + ", " + QUEUEDTEXT[q].target.y + ")");
					if (QUEUEDTEXT[q].otherstep == undefined || QUEUEDTEXT[q].otherstep == null) {
						QUEUEDTEXT[q].actor.locomotionPt(curMsg, QUEUEDTEXT[q].target.x, QUEUEDTEXT[q].target.y, doneWithForces);
					} else {
						var myx = QUEUEDTEXT[q].otherstep.actor;
						var myy = QUEUEDTEXT[q].otherstep.target;
						var temp = curMsg;
						QUEUEDTEXT[q].actor.locomotionPt(curMsg, QUEUEDTEXT[q].target.x, QUEUEDTEXT[q].target.y, function() {
							myx.pickup(temp, myy, doneWithForces);
						})
					}

					break;
				case "locomotionTarget":

					console.log("adding " + curMsg + " locomotionTarget " + QUEUEDTEXT[q].actor.name + " to (" + QUEUEDTEXT[q].target.x + ", " + QUEUEDTEXT[q].target.y + ")");
					if (QUEUEDTEXT[q].otherstep == undefined || QUEUEDTEXT[q].otherstep == null) {
						QUEUEDTEXT[q].actor.locomotionTarget(curMsg, QUEUEDTEXT[q].target, doneWithForces);
					} else {
						var myx = QUEUEDTEXT[q].otherstep.actor;
						var myy = QUEUEDTEXT[q].otherstep.target;
						var temp = curMsg;
						QUEUEDTEXT[q].actor.locomotionTarget(curMsg, QUEUEDTEXT[q].target, function() {
							myx.pickup(temp, myy, doneWithForces);
						})
					}
					break;
				case "pointAtPoint":
					console.log("adding " + curMsg + " pointAtPoint " + QUEUEDTEXT[q].actor.name + " to (" + QUEUEDTEXT[q].target.x + ", " + QUEUEDTEXT[q].target.y + ")");
					QUEUEDTEXT[q].actor.pointAtPoint(curMsg, QUEUEDTEXT[q].target.x, QUEUEDTEXT[q].target.y, doneWithForces);
					break;
				case "pointAtTarget":
					console.log("adding " + curMsg + " pointAtTarget " + QUEUEDTEXT[q].actor.name + " to (" + QUEUEDTEXT[q].target.x + ", " + QUEUEDTEXT[q].target.y + ")");
					QUEUEDTEXT[q].actor.pointAtTarget(curMsg, QUEUEDTEXT[q].target, doneWithForces);
					break;
				case "pickup":
					console.log("adding " + curMsg + " pickup " + QUEUEDTEXT[q].actor.name + " to (" + QUEUEDTEXT[q].target.x + ", " + QUEUEDTEXT[q].target.y + ")");
					QUEUEDTEXT[q].actor.pickup(curMsg, QUEUEDTEXT[q].target, doneWithForces);
					break;
				case "putdown":
					console.log("adding " + curMsg + " putdown " + QUEUEDTEXT[q].actor.name + " to (" + QUEUEDTEXT[q].target.x + ", " + QUEUEDTEXT[q].target.y + ")");
					QUEUEDTEXT[q].actor.putdown(curMsg, QUEUEDTEXT[q].target, doneWithForces);
					break;
				case "makecharlook":
					console.log("adding " + curMsg + " makecharlook " + QUEUEDTEXT[q].actor.name + " to (" + QUEUEDTEXT[q].target.x + ", " + QUEUEDTEXT[q].target.y + ")");
					makecharlook(QUEUEDTEXT[q].actor, curMsg, QUEUEDTEXT[q].target, doneWithForces);
					break;
				case "say":
					console.log("adding " + curMsg + " say " + QUEUEDTEXT[q].actor.name);
					QUEUEDTEXT[q].actor.say(curMsg, QUEUEDTEXT[q].target, doneWithForces);
					break;
				default:
					console.log("ERROR - invalid queued text!");

			}

			curMsg++;

		}

		// then cleanup all my forces variables
		forces.deleteAll();
	}

	function addchar(who, targetx, targety) {
		// adds char to forces
		console.log("Adding forces char " + who + " at (" + targetx + ", " + targety + ")");

		if (who == HUMAN) {
			new forces.Human(who, targetx, targety, charprecedence.indexOf(who), true, null);
		} else {
			new forces.FCharacter(who, targetx, targety, charprecedence.indexOf(who), true, null);
		}
	}

	function cleanupxys(x, y) {
		// when done calculating, reset the x & y values to work for the main function

		var newx = -1 * (x - 2312) / 2;
		var newy = (y - 209) / 2;
		return {
			x : newx,
			y : newy
		};

	}

	var HA = null;
	var G1 = null;
	var G2 = null;
	var HO = null;
	var fulld = new Date();
	var fulllog = fs.createWriteStream('logs/full' + ( BML ? 'BML' : ( USE_FORCES ? 'Forces' : 'Rules')) + (ACCURACY * 100) + 'log' + (fulld.getMonth() + 1 ) + "." + fulld.getDate() + "." + fulld.getFullYear() + " " + fulld.getHours() + "." + fulld.getMinutes() + "." + fulld.getSeconds() + '.csv', {
		'flags' : 'a'
	});
	fulllog.write('time,minx,maxx,miny,maxy,G1x,G1y,G2x,G2y,HAx,HAy,HOx,HOy\n');

	function writeXYs() {
		//fulllog.write('time,minx,maxx,miny,maxy,G1x,G1y,G2x,G2y,HAx,HAy,HOx,HOy\n');
		var minx = -1 * (193 - 2312) / 2;
		// to adjust for different dimensions for Unity vs JS
		var maxy = (209 - 209) / 2;
		var maxx = -1 * (2313 - 2312) / 2;
		var miny = (2042 - 209) / 2;
		for (var i = 0; i < characters.length; i++) {
			if (characters[i].x < minx) {
				minx = characters[i].x;
			}
			if (characters[i].y < miny) {
				miny = characters[i].y;
			}
			if (characters[i].x > maxx) {
				maxx = characters[i].x;
			}
			if (characters[i].y > maxy) {
				maxy = characters[i].y;
			}
			if (HA == null) {
				if (characters[i].name == "HAMLET") {
					HA = characters[i];
				}
			}
			if (HO == null) {
				if (characters[i].name == "HORATIO") {
					HO = characters[i];
				}
			}
			if (G1 == null) {
				if (characters[i].name == "GRAVEDIGGER1") {
					G1 = characters[i];
				}
			}
			if (G2 == null) {
				if (characters[i].name == "GRAVEDIGGER2") {
					G2 = characters[i];
				}
			}
		}
		fulllog.write((new Date().getTime()).toString() + ',' + minx + ',' + maxx + ',' + miny + ',' + maxy + ',' + G1.x + ',' + G1.y + ',' + G2.x + ',' + G2.y + ',' + HA.x + ',' + HA.y + ',' + HO.x + ',' + HO.y + '\n');
	}

	function isCharLine(data) {
		//console.log("isCharLine, data="+data+"+");

		var temp = data.replace(" ", "");
		var pos = chararray.indexOf(temp);
		if (pos != -1) {
			if (translatedchararray[pos] == "/CURRENT") {
				if (charContext != null) {
					//console.log("ischarline sending "+charContext.name);
					return charContext.name;
				} else {
					//console.log("ischarline sending G1 "+gravedigger1.name);
					return gravedigger1.name;
					// default to G1??
				}
			} else {
				//console.log("ischarline sending translated "+ translatedchararray[pos]);
				return translatedchararray[pos];
			}
		}
		return null;
	}

	function isPropLine(data) {

		var temp = data.replace(" ", "");
		var pos = locationarray.indexOf(temp);
		if (pos != -1) {
			//console.log("ispropline sending translated "+ translatedlocationarray[pos]);
			return translatedlocationarray[pos];
		} else if (temp[0] == '/') {
			return temp;
		}
		//		if (temp == "GRAVE" || temp == "CENTERBACKSTAGE" || temp == "AUDIENCE" || temp == "LANTERN" || temp == "SPADE" || temp == "SHOVEL" || temp == "SKULL" || temp == "STAGERIGHT")  {
		//		return true;
		//}
		return null;
	}

	function calcPosition(data, actor) {
		var result = new Array();

		var x = (actor.x * 2 / -1) + 2312;
		var y = (actor.y * 2) + 209;
		//console.log("position="+actor.x+","+actor.y);
		switch (data) {
			case "/BACK":
				// find actor's position and facing angle and move 50 backwards
				result[0] = x + ((50) * Math.sin(actor.angle + (Math.PI)));
				result[1] = y + ((50) * Math.cos(actor.angle + (Math.PI)));
				return result;
				break;
			case "/FORWARD":
				// find actor's position and facing angle and move 50 forwards
				result[0] = x + ((50) * Math.sin(actor.angle));
				result[1] = y + ((50) * Math.cos(actor.angle));
				return result;
				break;
			case "/RIGHT":
				// find actor's position and facing angle and move 50 to right
				result[0] = x + ((50) * Math.sin(actor.angle - (Math.PI / 2)));
				result[1] = y + ((50) * Math.cos(actor.angle - (Math.PI / 2)));
				return result;
				break;
			case "/LEFT":
				// find actor's position and facing angle and move 50 to left
				result[0] = x + ((50) * Math.sin(actor.angle + (Math.PI / 2)));
				result[1] = y + ((50) * Math.cos(actor.angle + (Math.PI / 2)));
				return result;
				break;
			case "/SKULL":
				// find actor's position and pick the skull closest to them
				var dist1 = Math.sqrt((actor.x - skull1.x) * (actor.x - skull1.x) + (actor.y - skull1.y) * (actor.y - skull1.y));
				var dist2 = Math.sqrt((actor.x - skull2.x) * (actor.x - skull2.x) + (actor.y - skull2.y) * (actor.y - skull2.y));
				//console.log("Checking SKULL, 1:" + dist1 + "," + dist2);
				if (dist1 < dist2) {
					return "SKULL1";
				} else {
					return "SKULL2";
				}

				break;
			case "/COIN":
				// return current actor
				if (charContext != null) {
					//console.log("in calcposition returning "+charContext.name);
					return charContext.name;
				} else {
					//console.log("in calcposition returning G1 "+ gravedigger1.name);
					return gravedigger1.name;
				}
				break;
			case "/CURRENT":
				// return current actor
				if (charContext != null) {
					//console.log("in calcposition returning 1 "+ charContext.name);
					return charContext.name;
				} else {
					//console.log("in calcposition returning G1 1 "+ gravedigger1.name);
					return gravedigger1.name;
				}
				break;
			default:
				//console.log("in calcposition returning null");
				return null;
				break;
		}
		//console.log("in calcposition returning null");
		return null;
	}

	function isMvmtLine(data) {
		if (data[0] == '(') {
			return true;
		}
		return false;
	}

	function isActionWord(word) {
		var singverb = verbInflector.singularize(word)
		singverb = singverb.toUpperCase();
		//word = singverb;

		if (lookarray.indexOf(singverb) != -1 || lookarray.indexOf(word) != -1) {
			return "LOOK";
		}
		if (walkarray.indexOf(singverb) != -1 || walkarray.indexOf(word) != -1) {
			return "MOVE";
		}
		if (pointarray.indexOf(singverb) != -1 || pointarray.indexOf(word) != -1) {
			return "POINT";
		}
		if (pickuparray.indexOf(singverb) != -1 || pickuparray.indexOf(word) != -1) {
			return "PICK";
		}
		if (putdownarray.indexOf(singverb) != -1 || putdownarray.indexOf(word) != -1) {
			return "PUT";
		}
		if (followarray.indexOf(singverb) != -1 || followarray.indexOf(word) != -1) {
			return "FOLLOW";
		}
		// now look for close-enough words to my action words to see if they are a match 90% or better
		var best = 0;
		var bestsaved = null;
		var curscore = 0;
		for (var i = 0; i < allarrays.length; i++) {
			for (var j = 0; j < allarrays[i].length; j++) {
				curscore = natural.JaroWinklerDistance(singverb, allarrays[i][j]);
				if (curscore > best) {
					best = curscore;
					bestsaved = allarrays[i][0];
				}
				curscore = natural.JaroWinklerDistance(word, allarrays[i][j]);
				if (curscore > best) {
					best = curscore;
					bestsaved = allarrays[i][0];
				}
			}
		}

		if (best > .9) {
			return bestsaved;
		}
		return null;
	}

	function setmvmtlines(thisLine, num, mynum, word, type, basemsgnum) {
		mvmtlines[thisLine][num][mynum] = word;
		mytype[thisLine][num][mynum] = type;
		myctr[thisLine][num]++;
		var notready = false;
		// check if all are populated, else wait some more
		/*
		for (var i = 0; i < mvmtlines[thisLine][num].length; i++) {
		if (mvmtlines[thisLine][num][i] == null || typeof(mvmtlines[thisLine][num][i] == undefined) || mvmtlines[thisLine][num][i].length == 0) {
		notready = true;
		console.log("notready - empty "+thisLine+","+num+","+i+": "+word + " so far "+myctr[thisLine][num][mynum]);
		break;
		}
		}*/
		//		if (!notready) {
		if (myctr[thisLine][num] == mvmtlines[thisLine][num].length) {
			//console.log(mvmtlines[thisLine][num]);
			//console.log(mytype[thisLine][num]);
			planmovement(thisLine, num, basemsgnum);
		}

	}

	function translate(thisLine, num, firstverb, actor, target, msgnum) {
		var best = null;
		if (mvmtlines[thisLine][num][firstverb] == 'empty') {
			// skip, can't do anything
			console.log("ERROR - verb is empty, skipping");
			var xmsgnum = msgnum;
			TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
				readyForNextMsg2(xmsgnum);
				xmsgnum = null;
			}, 100);
		} else if (mvmtlines[thisLine][num][firstverb].length == 2) {
			best = isActionWord(mvmtlines[thisLine][num][firstverb][0]);
			mvmtlines[thisLine][num][firstverb][1].forEach(function(synonym) {
				if ( best = null) {
					best = isActionWord(synonym);
				}
			});
		} else {
			best = isActionWord(mvmtlines[thisLine][num][firstverb]);
		}

		if (target != null && target[0] == '/') {
			// need to translate the target!!
			//console.log("translating target "+target);
			if (best == "FOLLOW") {
				target = calcPosition(actor, target);
			} else {
				target = calcPosition(target, actor);
			}

		}
		if (!( target instanceof Array) && target != null) {
			var temp = findItem('C', target);
			if (temp == null) {
				temp = findItem('O', target);
			}
			if (temp != null) {
				target = temp;
			}
		}
		//console.log(target);
		//console.log("In translate, target="+((target == null)?("null"):(((target instanceof Character || target instanceof Pawn)?(target.name):(target)))));

		// need to figure out how to find a point in 3 scenarios, for now just clearing the commands out
		switch(best) {
			case "MOVE":
				if ( target instanceof Array) {
					console.log(actor.name + " MOVE " + target + " readyForNextMsg2");
					checkmovetarget(actor, msgnum, target, readyForNextMsg2);
					//actor.locomotionPt(msgnum, target[0], target[1], readyForNextMsg2);
				} else if (target != null) {
					console.log(actor.name + " MOVE " + (( target instanceof Character || target instanceof Pawn) ? (target.name) : (target)) + " readyForNextMsg2");
					if ( target instanceof Character || ( target instanceof Pawn && (target.moveable || target.name == 'GRAVE' || target.name == 'STEPS' || target.name == 'STOOL'))) {
						//QUEUED[QUEUED.length] = actor.locomotionTarget(msgnum, target, readyForNextMsg2);
						QUEUEDTEXT[QUEUEDTEXT.length] = {
							actor : actor,
							motion : "locomotionTarget",
							target : target
						};
						readyForNextMsg2(msgnum);
					} else {
						checkmovetarget(actor, msgnum, target, readyForNextMsg2);
					}
					//actor.locomotionTarget(msgnum, target, readyForNextMsg2);
				} else {
					// need to figure out a point
					console.log("No target to move to");
					var xmsgnum = msgnum;
					TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
						readyForNextMsg2(xmsgnum);
						xmsgnum = null;
					}, 100);
				}
				break;
			case "POINT":
				if ( target instanceof Array) {
					console.log(actor.name + " POINT " + target);
					//QUEUED[QUEUED.length] = actor.pointAtPoint(msgnum, target[0], target[1], readyForNextMsg2);
					QUEUEDTEXT[QUEUEDTEXT.length] = {
						actor : actor,
						motion : "pointAtPoint",
						target : target
					};
					readyForNextMsg2(msgnum);
				} else if (target != null) {
					console.log(actor.name + " POINT " + (( target instanceof Character || target instanceof Pawn) ? (target.name) : (target)));
					//QUEUED[QUEUED.length] = actor.pointAtTarget(msgnum, target, readyForNextMsg2);
					QUEUEDTEXT[QUEUEDTEXT.length] = {
						actor : actor,
						motion : "pointAtTarget",
						target : target
					};
					readyForNextMsg2(msgnum);
				} else {
					// need to figure out a point
					console.log("No target to point to");
					var xmsgnum = msgnum;
					TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
						readyForNextMsg2(xmsgnum);
						xmsgnum = null;
					}, 100);
				}
				break;
			case "PICK":
				if (target != null) {
					console.log(actor.name + " PICK " + (( target instanceof Character || target instanceof Pawn) ? (target.name) : (target)));
					// if not at target, walk to it first, then pick it up
					if (distance(actor.x, actor.y, target.x, target.y) > characterSize + objectSize) {
						//console.log("locomotion readyForNextMsg2");
						//QUEUED[QUEUED.length] = actor.locomotionTarget(msgnum, target, function() {actor.pickup(msgnum, target, readyForNextMsg2);});
						QUEUEDTEXT[QUEUEDTEXT.length] = {
							actor : actor,
							motion : "locomotionTarget",
							target : target,
							otherstep : {
								actor : actor,
								motion : "pickup",
								target : target
							}
						};
						readyForNextMsg2(msgnum);
						//actor.pickup(msgnum, target, readyForNextMsg2);
					} else {
						//QUEUED[QUEUED.length] = actor.pickup(msgnum, target, readyForNextMsg2);
						QUEUEDTEXT[QUEUEDTEXT.length] = {
							actor : actor,
							motion : "pickup",
							target : target
						};
						readyForNextMsg2(msgnum);
					}
				} else {
					console.log("ERROR!! Trying to pick up nothing");
					var xmsgnum = msgnum;
					TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
						readyForNextMsg2(xmsgnum);
						xmsgnum = null;
					}, 100);
				}
				break;
			case "PUT":
				if (target != null) {
					console.log(actor.name + " PUT " + (( target instanceof Character || target instanceof Pawn) ? (target.name) : (target)));
					//QUEUED[QUEUED.length] = actor.putdown(msgnum, target, readyForNextMsg2);
					QUEUEDTEXT[QUEUEDTEXT.length] = {
						actor : actor,
						motion : "putdown",
						target : target
					};
					readyForNextMsg2(msgnum);
				} else {
					console.log("ERROR!! Trying to put down nothing");
					var xmsgnum = msgnum;
					TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
						readyForNextMsg2(xmsgnum);
						xmsgnum = null;
					}, 100);
				}
				break;
			case "LOOK":
				if ( target instanceof Array) {
					console.log(actor.name + " LOOK " + target);
					//QUEUED[QUEUED.length] = makecharlook(actor,msgnum,target,readyForNextMsg2);
					QUEUEDTEXT[QUEUEDTEXT.length] = {
						actor : actor,
						motion : "makecharlook",
						target : target
					};
					readyForNextMsg2(msgnum);
					//actor.lookAtPt(msgnum, target[0], target[1], readyForNextMsg2);
				} else if (target != null) {
					console.log(actor.name + " LOOK " + (( target instanceof Character || target instanceof Pawn) ? (target.name) : (target)));
					//QUEUED[QUEUED.length] = makecharlook(actor, msgnum, target, readyForNextMsg2);
					QUEUEDTEXT[QUEUEDTEXT.length] = {
						actor : actor,
						motion : "makecharlook",
						target : target
					};
					readyForNextMsg2(msgnum);
					//actor.lookAtTarget(msgnum, target, readyForNextMsg2);
				} else {
					// need to figure out a point
					console.log("No target to look to");
					var xmsgnum = msgnum;
					TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
						readyForNextMsg2(xmsgnum);
						xmsgnum = null;
					}, 100);
				}
				break;
			case "FOLLOW":
				if (target != null) {
					console.log(actor.name + " FOLLOW " + (( target instanceof Character || target instanceof Pawn) ? (target.name) : (target)));
					var xtarget = target;
					var xmsgnum = msgnum;
					var xactor = actor;
					TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
						var xxtarget = xtarget;
						var xxmsgnum = xmsgnum;
						var xxactor = xactor;
						//QUEUED[QUEUED.length] = xtarget.locomotionTarget(xmsgnum, xactor, //function() {checkmovetarget(xxtarget, xxmsgnum, xxactor, readyForNextMsg2); xxtarget = null; xxmsgnum = null; xxactor = null;}); xtarget = null; xmsgnum = null; xactor = null;}
						//readyForNextMsg2);
						QUEUEDTEXT[QUEUEDTEXT.length] = {
							actor : xtarget,
							motion : "locomotionTarget",
							target : xactor
						};
						readyForNextMsg2(xmsgnum);
					}, 65);

				} else {
					// need to figure out a point
					console.log("No target to follow");
					var xmsgnum = msgnum;
					TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
						readyForNextMsg2(xmsgnum);
						xmsgnum = null;
					}, 100);
				}
				break;
			case null:
				console.log("ERROR - no idea on what the verb is, so ignore?");
				//TIMEOUTS[TIMEOUTS.length] = setTimeout(function(){readyForNextMsg2(msgnum)},100);
				readyForNextMsg2(msgnum);
				break;
			default:
				// problem!!
				console.log("ERROR - unknown verb!");
				var xmsgnum = msgnum;
				TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
					readyForNextMsg2(xmsgnum);
					xmsgnum = null;
				}, 100);
				break;
		}
	}

	function distance(x, y, obj2x, obj2y) {
		var dist = 0;
		dist = Math.sqrt((x - obj2x) * (x - obj2x) + (y - obj2y) * (y - obj2y));
		return dist;
	}

	function checkmovetarget(actor, msgnum, target, callbackFunc) {
		var aud = findItem('O', 'AUDIENCE');
		var mydisttoaud = distance(target.x, target.y, target.x, aud.y);
		var chardisttoaud = 0;
		var chardisttome = 0;
		var charAngle = 0;
		var changed = false;
		var x = 0;
		//target.x;
		var y = 0;
		//target.y;
		var isarray = false;
		if ( target instanceof Array) {
			x = target[0];
			y = target[1];
			isarray = true;
			// can adjust our target
		} else {
			if ( target instanceof Pawn && (target.moveable || (target.name == 'GRAVE' || target.name == 'STEPS' || target.name == 'STOOL'))) {
				ispawn = true;
				// need to reach target
			}
			x = target.x;
			y = target.y;
		}
		var diff = 0;
		var audAngle = 0;
		//console.log("In checkmovetarget=" + actor.name + ", target is " + (( target instanceof Array) ? ("[" + target[0] + "," + target[1] + "]") : (target.x + "," + target.y)));
		if (( target instanceof Array && coordonstage(target)) || (!( target instanceof Array) && ingrid(target))) {
			//if(target instanceof Array || target.onstage()) {
			//console.log("In if stmt of checkmovetarget");
			for (var i = 0; i < characters.length; i++) {
				//console.log("In for characters.length 1 of checkmovetarget");
				if (characters[i].onstage()) {
					if (characters[i].name == actor.name) {
						// ignore
					} else {
						chardisttoaud = distance(characters[i].x, characters[i].y, characters[i].x, aud.y);
						//console.log("Checking " + actor.name + " vs " + characters[i].name + ", myauddist=" + mydisttoaud + ", theirs=" + chardisttoaud);
						if (charprecedence.indexOf(actor.name) < charprecedence.indexOf(characters[i].name) && chardisttoaud < mydisttoaud) {
							// move my target closer to the audience
							diff = mydisttoaud - chardisttoaud + 53;
							//(-1 * (106 - 2312) / 2);
							// move 3 feet closer to audience
							//audAngle = Math.atan2(y - aud.y, aud.x - x) + Math.PI / 2;
							audAngle = 0;
							// want this to just be in the positive y axis direction
							if (audAngle > Math.PI * 2) {
								audAngle = audAngle - Math.PI * 2;

							} else if (audAngle < 0) {
								audAngle = audAngle + Math.PI * 2;

							}
							if (isarray) {
								x = x;
								// + diff * Math.sin(audAngle);
								y = y - diff;
								// * Math.cos(audAngle);
								console.log("updating because actor " + actor.name + " is less important than char " + characters[i].name + ": [" + x + "," + y + "]");
							} else {
								/*	// move target instead - add new message
								 console.log("moving other char because actor "+actor.name+" is less important than char "+characters[i].name+": ["+characters[i].x+","+(characters[i].y-diff)+"]");
								 WAITINGON[WAITINGON.length] = curMsg;
								 // this is so we stop everything until we've parsed and acted on this line
								 WAITING = true;

								 checkmovetarget(characters[i], curMsg, [characters[i].x, characters[i].y + diff], callbackFunc);
								 curMsg++;*/
							}

							//changed = true;
						} else if (charprecedence.indexOf(actor.name) > charprecedence.indexOf(characters[i].name) && mydisttoaud < chardisttoaud) {
							// move my target further from audience
							diff = chardisttoaud - mydisttoaud + 53;
							//(-1 * (106 - 2312) / 2);
							// move 3 feet closer to audience
							audAngle = 0;
							// want this to be in the positive y axis direction
							//audAngle = Math.atan2(y - aud.y, aud.x - x) + Math.PI / 2;
							audAngle = audAngle - Math.PI;
							// change to opposite direction
							if (audAngle > Math.PI * 2) {
								audAngle = audAngle - Math.PI * 2;

							} else if (audAngle < 0) {
								audAngle = audAngle + Math.PI * 2;

							}
							if (isarray) {
								x = x;
								// + diff * Math.sin(audAngle);
								y = y + diff;
								// * Math.cos(audAngle);
								console.log("Updating because actor " + actor.name + " is more important than char " + characters[i].name + ": [" + x + "," + y + "]");
							} else {
								/*	console.log("moving other char because actor "+actor.name+" is more important than char "+characters[i].name+": ["+characters[i].x+","+(characters[i].y-diff)+"]");
								 WAITINGON[WAITINGON.length] = curMsg;
								 // this is so we stop everything until we've parsed and acted on this line
								 WAITING = true;

								 checkmovetarget(characters[i], curMsg, [characters[i].x, characters[i].y - diff], callbackFunc);
								 curMsg++;*/
							}
							//changed = true;
						} else {
							//console.log("Doing nothing in checkmovetarget");
						}
					}
					//console.log("UPDATED "+actor.name+" vs "+characters[i].name +", myauddist="+mydisttoaud+", theirs="+chardisttoaud);
				}// else not worth moving because of this character
				mydisttoaud = distance(x, y, x, aud.y);
			}
			// check to make sure no closer than 3 feet (-1*(106-2312)/2) from any character, else adjust again
			for (var j = 0; j < characters.length; j++) {
				//console.log("in second for loop of checkmovetarget");
				if (characters[j].onstage()) {
					if (characters[j].name == actor.name) {
						// ignore
					} else {

						chardisttome = distance(x, y, characters[j].x, characters[j].y);
						//console.log("Checking " + actor.name + " vs " + characters[j].name + ", distance apart=" + chardisttome);
						if (chardisttome < 53) {;//(-1 * (106 - 2312) / 2)) {
							// move away from them in the opposite path of where currently at
							charAngle = Math.atan2(y - characters[j].y, characters[j].x - x) + Math.PI / 2;
							charAngle = charAngle - Math.PI;
							// change to opposite direction
							if (charAngle > Math.PI * 2) {
								charAngle = charAngle - Math.PI * 2;

							} else if (charAngle < 0) {
								charAngle = charAngle + Math.PI * 2;

							}

							x = x + diff * Math.sin(charAngle);
							y = y + diff * Math.cos(charAngle);
							console.log("Updating because actor " + actor.name + " is too close to char " + characters[j].name + ": [" + x + "," + y + "]");
							changed = true;
						} else {
							//console.log("Doing nothing in checkmovetarget 2nd loop");
						}
					}
					//console.log("UPDATED "+actor.name+" vs "+characters[j].name +", distance apart="+chardisttome);
				} // else don't worry about being too close to them
			}
			//translate back to paper grid coordinates
			//if (!changed) {
			x = (x * 2 / -1) + 2312;
			y = (y * 2) + 209;

			//}
			//console.log("In checkmovetarget RESULT=" + actor.name + ", target is " + (( target instanceof Array) ? ("[" + target[0] + "," + target[1] + "]") : (target.x + "," + target.y)) + ", updated to: [" + x + "," + y + "]");
			// done calcs, so let's move now
			if (!( target instanceof Array) && x == target.x && y == target.y) {
				//QUEUED[QUEUED.length] = actor.locomotionTarget(msgnum, target, callbackFunc);
				QUEUEDTEXT[QUEUEDTEXT.length] = {
					actor : actor,
					motion : "locomotionTarget",
					target : target
				};
				callbackFunc(msgnum);
			} else {
				//QUEUED[QUEUED.length] = actor.locomotionPt(msgnum, x, y, callbackFunc);
				QUEUEDTEXT[QUEUEDTEXT.length] = {
					actor : actor,
					motion : "locomotionPt",
					target : {
						x : x,
						y : y
					}
				};
				callbackFunc(msgnum);
			}
		} else if ( target instanceof Array) {
			//console.log("checkmovetarget - skipped all char checks because array");
			//QUEUED[QUEUED.length] = actor.locomotionPt(msgnum, target[0], target[1], callbackFunc);
			QUEUEDTEXT[QUEUEDTEXT.length] = {
				actor : actor,
				motion : "locomotionPt",
				target : target
			};
			callbackFunc(msgnum);
		} else {
			//console.log("checkmovetarget - skipped all char checks for other");
			// just move to the target since we're walking offstage or to a pawn
			//QUEUED[QUEUED.length] = actor.locomotionTarget(msgnum, target, callbackFunc);
			QUEUEDTEXT[QUEUEDTEXT.length] = {
				actor : actor,
				motion : "locomotionTarget",
				target : target
			};
			callbackFunc(msgnum);
		}
	}

	function planmovement(thisLine, num, basemsgnum) {
		var allnouns = mytype[thisLine][num].allIndexOf('n');
		//console.log("allnouns = "+allnouns);
		var firstnindex = -1;
		var secondnindex = -1;
		var firstnoun = null;
		var firsttype = null;
		var firstverb = mytype[thisLine][num].indexOf('v');
		var secondnoun = null;
		var secondtype = null;
		var actor = null;
		var target = null;
		var temp = null;

		if (firstverb == -1) {
			// cannot do anything, so skip
			console.log("ERROR - no verb, skipping");
			var xbasemsgnum = basemsgnum;
			var xnum = num;
			TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
				readyForNextMsg2(xbasemsgnum + xnum);
				xbasemsgnum = null;
				xnum = null;
			}, 100);
		} else {
			if (allnouns[0] != -1) {
				// have at least one noun
				allnouns.forEach(function(nounindex, index) {
					var tocheck = null;
					if (mvmtlines[thisLine][num][nounindex].length == 2) {
						tocheck = mvmtlines[thisLine][num][nounindex][0];
					} else {
						tocheck = mvmtlines[thisLine][num][nounindex];
					}
					temp = isCharLine(tocheck);
					//console.log("isCharLine = "+temp);
					if (temp != null && (index < firstnindex || firstnindex == -1)) {
						if (firstnindex != -1) {
							secondnindex = firstnindex;
							secondnoun = firstnoun;
							secondtype = firsttype;
						}
						firstnindex = index;
						firstnoun = temp;
						firsttype = 'C';
					} else if (temp != null && (index < secondnindex || secondnindex == -1)) {
						secondnindex = index;
						secondnoun = temp;
						secondtype = 'C';
					} else if (temp == null) {

						temp = isPropLine(tocheck);
						//console.log("isPropLine = "+temp);
						if (temp != null && (index < firstnindex || firstnindex == -1)) {
							if (firstnindex != -1) {
								secondnindex = firstnindex;
								secondnoun = firstnoun;
								secondtype = firsttype;
							}
							firstnindex = index;
							firstnoun = temp;
							firsttype = 'O';
						} else if (temp != null && (index < secondnindex || secondnindex == -1)) {
							secondnindex = index;
							secondnoun = temp;
							secondtype = 'O';
						} else if (temp == null) {

							// do nothing???
						}
					}
				});
				//console.log("NOUNS:"+firstnoun+","+secondnoun);
				if (secondnindex == -1) {
					if (firstnindex == -1) {
						// no nouns that we can parse, so skip
						console.log("ERROR - no nouns that we can parse, skipping");
						var xbasemsgnum = basemsgnum;
						var xnum = num;
						TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
							readyForNextMsg2(xbasemsgnum + xnum);
							xbasemsgnum = null;
							xnum = null;
						}, 100);
					} else {
						// have only one noun, so assume we use current context and this as the target
						if (charContext == null) {
							actor = gravedigger1;
							console.log("assuming character context is gravedigger1");
						} else {
							actor = charContext;
						}
						if (firstnoun[0] == '/') {
							target = calcPosition(firstnoun, actor);
						} else {
							target = findItem(firsttype, firstnoun);
						}
						if (target == null) {
							console.log("ERROR - couldn't find target despite it being of type " + firsttype + "," + firstnoun);
							var xbasemsgnum = basemsgnum;
							var xnum = num;
							TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
								readyForNextMsg2(xbasemsgnum + xnum);
								xbasemsgnum = null;
								xnum = null;
							}, 100);
						} else {
							translate(thisLine, num, firstverb, actor, target, basemsgnum + num);
						}
					}
				} else {
					// have two nouns, so lets use them!!
					actor = findItem(firsttype, firstnoun);
					if (actor == null) {
						console.log("ERROR - couldn't find actor despite it being of type " + firsttype + "," + firstnoun);
						var xbasemsgnum = basemsgnum;
						var xnum = num;
						TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
							readyForNextMsg2(xbasemsgnum + xnum);
							xbasemsgnum = null;
							xnum = null;
						}, 100);
					} else {
						if (secondnoun[0] == '/') {
							target = calcPosition(secondnoun, actor);
						} else {
							target = findItem(secondtype, secondnoun);
						}
						if (target == null) {
							console.log("ERROR - couldn't find second target despite it being of type " + secondtype + "," + secondnoun);
							var xbasemsgnum = basemsgnum;
							var xnum = num;
							TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
								readyForNextMsg2(xbasemsgnum + xnum);
								xbasemsgnum = null;
								xnum = null;
							}, 100);
						} else {
							translate(thisLine, num, firstverb, actor, target, basemsgnum + num);
						}
					}
				}

			} else {
				// no nouns, cannot do anything, so quit
				console.log("ERROR - no nouns, skipping");
				var xbasemsgnum = basemsgnum;
				var xnum = num;
				TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
					readyForNextMsg2(xbasemsgnum + xnum);
					xbasemsgnum = null;
					xnum = null;
				}, 100);
			}
		}
	}

	function parseMvmt(data, thisLine, num, basemsgnum) {
		var actor = null;
		var target = null;

		// call wordnet to see if verb and synonymns for our 4 verbs

		// figure out if there is a person before the verb, if not use charContext

		// figure out if there is a person or object after the verb, if not check for spatial locations, else no target

		// whic
		//console.log("found punctutation="+data);
		var parsedSentence = tokenizer.tokenize(data);
		//				var parsedSentence = data.split(" ");
		mvmtlines[thisLine][num] = new Array(parsedSentence.length);
		mytype[thisLine][num] = new Array(parsedSentence.length);
		myctr[thisLine][num] = 0;
		parsedSentence.forEach(function(word, index) {
			//for (var i = 0; i < parsedSentence.length; i++) {
			if (word.length == 1) {
				// ignore, not worth working with
				setmvmtlines(thisLine, num, index, 'empty', 'o', basemsgnum);
			} else {
				var mynum = index;
				//console.log("parsed "+thisLine+","+num+","+mynum+","+parsedSentence.length+":"+word);
				var nchar = isCharLine(word);
				var prop = isPropLine(word);
				if (nchar != null || prop != null) {
					// save this item & ignore doing a lookup
					//console.log("Mvmt Parse!! - found character:"+thisLine+","+num+","+mynum+","+parsedSentence.length+": "+word);
					if (nchar != null) {
						setmvmtlines(thisLine, num, mynum, nchar, 'n', basemsgnum);
					} else {
						setmvmtlines(thisLine, num, mynum, prop, 'n', basemsgnum);
					}
					//mvmtlines[thisLine][num][mynum] = word;
				} else {
					// check if one of our reserved words before I do a lookup? save some async calls...
					var actionword = isActionWord(word);
					if (actionword != null) {
						setmvmtlines(thisLine, num, mynum, actionword, 'v', basemsgnum);
						//mvmtlines[thisLine][num][mynum] = actionword;
					} else {
						wordnet.lookup(word, function(results) {
							// do I only want to look at the first one?
							//	console.log("results=");
							//	console.log(results);
							if (results != undefined && results != null && results.length > 0 && (results[0].pos == 'n' || results[0].pos == 'v')) {
								//console.log("Mvmt Parse!! - "+thisLine+","+num+","+mynum+","+parsedSentence.length+": "+results[0].pos+", "+results[0].synonyms);
								setmvmtlines(thisLine, num, mynum, [word, results[0].synonyms], results[0].pos, basemsgnum);
								//mvmtlines[thisLine][num][mynum] = [word, results[0].synonyms.toUpperCase()];
								//mynum = null;
							} else {
								if (results != undefined && results != null && results.length > 0) {
									setmvmtlines(thisLine, num, mynum, "empty", results[0].pos, basemsgnum);
								} else {
									setmvmtlines(thisLine, num, mynum, "empty", 'o', basemsgnum);
								}
								//mvmtlines[thisLine][num][mynum] = "empty"; // this is my key to note skipping
							}
							//results.forEach(function(result) {

							//	if (result.pos == 'n' || result.pos == 'v') {
							//		console.log("Mvmt Parse!! - "+thisLine+","+num+","+parsedSentence.indexOf(mynum)+": "+result.pos+", "+result.synonyms);
							//	}
							//console.log("Synonymns:");
							//console.log(result.synonyms);
							//console.log("POS="+result.pos);
							//});
						});
					}
				}
			}
			//}
		});

		/*actor = findItem('C', charContext);
		 if (actor == null) { // only keep for debug version
		 actor = characters[0];
		 prevCharContext = characters[1];
		 }
		 WAITINGON[WAITINGON.length] = curMsg;
		 WAITING = true;
		 console.log("mvmt-"+actor.name+" look at "+prevCharContext.name +",num="+curMsg);
		 actor.lookAtTarget(curMsg, prevCharContext, readyForNextMsg2);
		 //setTimeout(readyForNextMsg2(curMsg), 1000);
		 curMsg++;*/

	}

	function parseLine() {
		// do any motion with the next speech line for the same character, stop when hit next motion or next character
		var curLineData;
		var actor = null;
		var nchar = null;
		//	console.log("length="+ALLDATA[1].length);
		//	console.log("first three lines are:"+ALLDATA[0]+"+\n"+ALLDATA[1]+"+\n"+ALLDATA[2]+"+\n");
		// send messages for each line until hit either a movement or a character line, but do for at least one line always
		do {
			if (curLine != ALLDATA.length) {
				//console.log(ALLDATA[curLine]);
				//console.log(WAITINGON.length);
				// need to save the current character context in a global
				// if char line, save in global and get next line
				nchar = isCharLine(ALLDATA[curLine]);
				if (nchar != null) {
					//console.log("is char line+"+ALLDATA[curLine]+"+");

					prevCharContext = charContext;
					charContext = findItem('C', ALLDATA[curLine]);
					//WAITINGON[WAITINGON.length] = curMsg;
					//WAITING = true;
					//readyForNextMsg2(curMsg);
					//curMsg++;
					//		this.turning = false;
					//callbackFunc(msgnum);
					//		WAITINGON[WAITINGON.length] = curMsg;
					//		WAITING = true;
					//		console.log("sent msgnum#"+curMsg);
					//		TIMEOUTS[TIMEOUTS.length] = setTimeout(function(){readyForNextMsg2(curMsg)},100);
					//		curMsg++;
					//console.log("char-"+((prevCharContext==null)?("null"):(prevCharContext.name))+","+charContext.name);
				} else if (isMvmtLine(ALLDATA[curLine])) {
					//console.log("is mvmt line");

					// parse out my spatial stuff
					// parse punctuation out - repeat for each statement separated by punctuation
					var puncList = ALLDATA[curLine].replace(")", "").replace("(", "").split(/[!.?,;:"-]/);
					mvmtlines[curLine] = new Array(puncList.length);
					myctr[curLine] = new Array(puncList.length);
					mytype[curLine] = new Array(puncList.length);
					var basemsgnum = curMsg;
					for (var j = 0; j < puncList.length; j++) {
						if (puncList[j][0] == ' ') {
							// remove leading spaces
							puncList[j] = puncList[j].replace(/^\s+|\s+$/g, "");
						}
						//console.log("Adding msg#"+curMsg+", "+puncList[j]+"+");
						WAITINGON[WAITINGON.length] = curMsg;
						// this is so we stop everything until we've parsed and acted on this line
						WAITING = true;
						curMsg++;
						if (puncList[j].length != 0) {

							parseMvmt(puncList[j], curLine, j, basemsgnum);
						} else {
							//	setmvmtlines(curLine, j, -1, "empty");
							//TIMEOUTS[TIMEOUTS.length] = setTimeout(function(){readyForNextMsg2(basemsgnum+j)},100);
							readyForNextMsg2(basemsgnum + j);
						}
					}
					/*
					 actor = charContext;
					 if (actor == null) { // only keep for debug version
					 actor = characters[0];
					 prevCharContext = characters[1];
					 }
					 if (prevCharContext == null) {
					 prevCharContext = characters[1];
					 }
					 WAITINGON[WAITINGON.length] = curMsg;
					 WAITING = true;
					 //console.log("mvmt-"+actor.name+" look at "+prevCharContext.name +",num="+curMsg);
					 actor.pointAtTarget(curMsg, grave, readyForNextMsg2);
					 //setTimeout(readyForNextMsg2(curMsg), 1000);
					 curMsg++;
					 */

				} else {
					//console.log("is speech line");
					// this is just speech, so say it - can never have two speech lines in sequence since it would have to either have a motion or a new character speaking
					actor = charContext;
					/*if (actor == null) { // only keep for debug version
					actor = characters[0];
					charContext = characters[1];
					}
					if (charContext == null) {
					charContext = characters[1];
					}*/
					//console.log("actor = "+actor.name);
					//console.log("Adding msg#"+curMsg);
					WAITINGON[WAITINGON.length] = curMsg;
					WAITING = true;
					//console.log((new Date().getTime()).toString()+"-added message#"+curMsg + ALLDATA[curLine]);
					//	TIMEOUTS[TIMEOUTS.length] = setTimeout(function(){actor.say(curMsg, ALLDATA[curLine], readyForNextMsg2)},100);
					//QUEUED[QUEUED.length] = actor.say(curMsg, ALLDATA[curLine], readyForNextMsg2);
					QUEUEDTEXT[QUEUEDTEXT.length] = {
						actor : actor,
						motion : "say",
						target : ALLDATA[curLine]
					};
					readyForNextMsg2(curMsg);
					curMsg++;
					//var thischar = null;
					//var refchar = null;
					// also send some gaze stuff for all chars to look at current char
					for (var i = 0; i < characters.length; i++) {
						if (characters[i].name == actor.name) {
							// do nothing for the gaze
						} else {

							if (ingrid(characters[i])) {
								// make them look at the current character speaking -- only if onstage
								//console.log("Adding msg#"+curMsg);
								WAITINGON[WAITINGON.length] = curMsg;
								WAITING = true;
								//QUEUED[QUEUED.length] = makecharlook(characters[i], curMsg, actor, readyForNextMsg2);
								QUEUEDTEXT[QUEUEDTEXT.length] = {
									actor : characters[i],
									motion : "makecharlook",
									target : actor
								};
								readyForNextMsg2(curMsg);
								//var thischar = characters[i];
								//var refchar = charContext;
								//console.log("-added message#"+curMsg+","+characters[i].name+","+actor.name);
								//TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {console.log("thischar="+thischar.name); thischar.lookAtTarget(curMsg, refchar, readyForNextMsg2); thischar = null; refchar = null;},100);
								//characters[i].lookAtTarget(curMsg, actor, readyForNextMsg2);
								curMsg++;
							}
						}
					}
				}
				curLine++;
				//console.log("after curLine++="+ALLDATA[curLine]);
			} else {
				console.log("Play is finished!!" + randomcounter);
				var doned = new Date();
				var donelog = fs.createWriteStream('logs/full' + ( BML ? 'BML' : ( USE_FORCES ? 'Forces' : 'Rules')) + (ACCURACY * 100) + 'done' + (fulld.getMonth() + 1 ) + "." + fulld.getDate() + "." + fulld.getFullYear() + " " + fulld.getHours() + "." + fulld.getMinutes() + "." + fulld.getSeconds() + '.csv', {
					'flags' : 'a'
				});
				donelog.write('done\n');

			}
		} while (curLine < ALLDATA.length && (isCharLine(ALLDATA[curLine]) == null && !(isMvmtLine(ALLDATA[curLine])))  || (curLine != 0 && isCharLine(ALLDATA[curLine-1]) != null && isMvmtLine(ALLDATA[curLine])));

	}

	function makecharlook(who, msgnum, target, callbackFunc) {
		if (!( target instanceof Array) && who.name == target.name) {
			callbackFunc(msgnum);
			// do nothing, doesn't make sense to look at yourself
		} else {
			var diff = 0;
			//console.log("Make char "+who.name+" ["+who.x+","+who.y+"] look at "+((target instanceof Array)?("["+target[0]+","+target[1]+"]"):(target.name)));
			var aud = findItem('O', "AUDIENCE");
			if ( target instanceof Array) {
				target = {
					x : target[0],
					y : target[1]
				};
			} else {

			}
			var targetAngle = Math.atan2(who.y - target.y, target.x - who.x) + Math.PI / 2;
			if (targetAngle > Math.PI * 2) {
				targetAngle = targetAngle - Math.PI * 2;

			} else if (targetAngle < 0) {
				targetAngle = targetAngle + Math.PI * 2;

			}
			/*
			 var audAngle = 0;//Math.atan2(who.y - aud.y, aud.x - who.x) + Math.PI / 2;
			 if(audAngle > Math.PI * 2) {
			 audAngle = audAngle - Math.PI * 2;

			 } else if(audAngle < 0) {
			 audAngle = audAngle + Math.PI * 2;

			 }
			 if (targetAngle < Math.PI) { // so average in correct side/direction
			 audAngle = 0;
			 } else {
			 audAngle = Math.PI*2;
			 }*/
			if (targetAngle < Math.PI / 2 || targetAngle > Math.PI * 3 / 2) {
				//console.log("Upd char "+who.name+" ["+who.x+","+who.y+"] look at "+((target instanceof Array)?("["+target[0]+","+target[1]+"]"):(target.name)));
				who.lookAtTarget(msgnum, target, callbackFunc);
			} else if (targetAngle <= Math.PI) {

				ptx = who.x + characterSize * Math.sin(Math.PI / 2);
				pty = who.y + characterSize * Math.cos(Math.PI / 2);
				ptx = (ptx * 2 / -1) + 2312;
				pty = (pty * 2) + 209;
				//console.log("Upd char "+who.name+" [+"+who.x+","+who.y+"] look at "+"["+ptx+","+pty+"], angle=Math.PI/2");
				who.lookAtPt(msgnum, ptx, pty, callbackFunc);
			} else {

				ptx = who.x + characterSize * Math.sin(3 * Math.PI / 2);
				pty = who.y + characterSize * Math.cos(3 * Math.PI / 2);
				ptx = (ptx * 2 / -1) + 2312;
				pty = (pty * 2) + 209;
				//console.log("Upd char "+who.name+" [+"+who.x+","+who.y+"] look at "+"["+ptx+","+pty+"], angle=3*Math.PI/2");
				who.lookAtPt(msgnum, ptx, pty, callbackFunc);
			}
			/*
			 // calculate the angle between target & audience, then call lookAtTarget or lookAtPt
			 diff = Math.abs(targetAngle - audAngle);
			 console.log("Target angle for "+who.name+"="+(targetAngle/Math.PI*180)+" vs audience ="+(audAngle/Math.PI*180)+", diff="+(diff/Math.PI*180) );
			 if(diff <= (Math.PI/2) || diff >= (3*Math.PI/2)) {
			 console.log("Just going to look at target");
			 who.lookAtTarget(msgnum, target, callbackFunc);

			 } else {

			 var ptAngle = (targetAngle + audAngle) / 2;
			 var ptx = who.x + characterSize * Math.sin(ptAngle);
			 var pty = who.y + characterSize * Math.cos(ptAngle);
			 console.log("Looking at modified target angle "+(ptAngle/Math.PI*180)+": ["+ptx+","+pty+"]");
			 who.lookAtPt(msgnum, ptx, pty, callbackFunc);
			 }
			 //console.log("UPDATED Target angle for "+who.name+"="+(targetAngle/Math.PI*180)+" vs audience ="+(audAngle/Math.PI*180)+", diff="+(diff/Math.PI*180) );
			 */
		}
	}

	function coordonstage(target) {
		var maxx = -1 * (193 - 2312) / 2;
		// to adjust for different dimensions for Unity vs JS
		var miny = (209 - 209) / 2;
		var minx = -1 * (2313 - 2312) / 2;
		var maxy = (2042 - 209) / 2;
		//console.log("Comparing "+mychar.name+" at ("+mychar.x+","+mychar.y+") to ("+minx+"-"+maxx+","+miny+"-"+maxy+")");
		if (target[0] > minx && target[0] < maxx) {
			if (target[1] > miny && target[1] < maxy) {
				//console.log("Array target is onstage ["+target[0]+","+target[1]+"]");
				return true;
			}
		}
		//console.log("Array target is NOT onstage ["+target[0]+","+target[1]+"]");
		return false;
	}

	function ingrid(mychar) {
		var maxx = -1 * (193 - 2312) / 2;
		// to adjust for different dimensions for Unity vs JS
		var miny = (209 - 209) / 2;
		var minx = -1 * (2313 - 2312) / 2;
		var maxy = (2042 - 209) / 2;
		//console.log("Comparing "+mychar.name+" at ("+mychar.x+","+mychar.y+") to ("+minx+"-"+maxx+","+miny+"-"+maxy+")");
		if (mychar.x > minx && mychar.x < maxx) {
			if (mychar.y > miny && mychar.y < maxy) {
				//console.log("Char target is onstage "+mychar.name + ": ["+mychar.x+","+mychar.y+"]");
				return true;
			}
		}
		//console.log("Char target is NOT onstage "+mychar.name + ": ["+mychar.x+","+mychar.y+"]");
		return false;
	}

	function nextLine() {
		// parse ALLDATA[curLine] & execute it
		// if first value is Y, repeat
		// be sure to add msgnum to WAITINGON for each line
		//console.log(ALLDATA[curLine]);
		var curLineData;
		// = ALLDATA[curLine].split('\t');
		//for (var i=0; i < curLineData.length; i++) {
		//console.log(curLineData[i]);
		//}
		if (ALLDATA[curLine] != undefined) {
			do {
				curLineData = ALLDATA[curLine].split('\t');
				if (curLineData.length > 1) {
					//console.log("sent this message #"+curLine+":"+ALLDATA[curLine]);
					if (curLineData[1] == "SPEAK") {
						// just saying speech, so do a tiny bit of "nonverbal behavior" with it
						// curLineData[2] = actor
						// curLineData[3] = recipient
						// curLineData[4] = xml for speech -- remove all <> tags within it too!
						var actor = findItem('C', curLineData[2]);
						var recipient = findItem('C', curLineData[3]);
						if (recipient == null) {
							recipient = findItem('O', curLineData[3]);
						}
						//get text
						var parser = new xml2js.Parser();
						parser.parseString(curLineData[4], function(err, result) {
							//console.log(result.bml.speech["#"]);
							WAITINGON[WAITINGON.length] = curMsg;
							WAITING = true;
							//console.log("added message#"+curMsg );
							actor.say(curMsg, result.bml.speech["#"], readyForNextMsg);
							curMsg++;
						});
						/*var text = null;
						 var startPos = 0;
						 var endPos = 0;
						 startPos = curLineData[4].indexOf("application/ssml+xml"+String.fromCharCode(34)+">");
						 endPos = curLineData[4].indexOf("</speech>");
						 text = curLineData[4].substring(startPos+22,endPos-startPos-22);

						 WAITINGON[WAITINGON.length] = curMsg;
						 WAITING = true;
						 actor.say(curMsg, text, readyForNextMsg);
						 curMsg++;*/

					} else {
						// need to parse xml better to get params and type of movement, so call parseXML
						var parser = new xml2js.Parser();

						/*parser.on('end', function(result) { // handles the split text, so have it call parseXML instead
						 console.log("FULLTEXT=");
						 console.log(result);
						 console.log("TRY INDEX=");
						 console.log(result.BML.REACH["@"]);
						 console.log("FORLOOP=");
						 for (var key in result.BML.REACH["@"]) {
						 console.log(key);
						 console.log(result.BML.REACH["@"][key]);
						 }
						 console.log("REACH ONLY=");
						 console.log(result.BML.REACH);
						 });*/
						var temp = curLineData[4].toUpperCase();
						// make uppercase for easier comparisons
						temp = temp.replace(/sbm:/gi, "");
						// replace any sbm: things so easier to find objects
						//console.log("Replaced string:"+ temp);
						var myxml = parser.parseString(temp, function(err, result) {
							parseXML(result, findItem('C', curLineData[2]), curMsg);
						});
						// parse the string

						//	var bmlonly = curLineData[4].substring(curLineData[4].toUpperCase().indexOf("<BML>")).toUpperCase();
						//	parseXML(findItem('C', curLineData[2]), curMsg, bmlonly);
					}
				}
				curLine++;
				//curLineData = ALLDATA[curLine].split('\t');
			} while (curLineData[0] == "Y" || (ALLDATA[curLine] != null && ALLDATA[curLine] != undefined && ALLDATA[curLine].replace(/^\s+|\s+$/g, '')  == ""));
		} else {
			console.log("Play is finished!!" + randomcounter);
			var doned1 = new Date();
			var done1log = fs.createWriteStream('logs/full' + ( BML ? 'BML' : ( USE_FORCES ? 'Forces' : 'Rules')) + (ACCURACY * 100) + 'done' + (fulld.getMonth() + 1 ) + "." + fulld.getDate() + "." + fulld.getFullYear() + " " + fulld.getHours() + "." + fulld.getMinutes() + "." + fulld.getSeconds() + '.csv', {
				'flags' : 'a'
			});
			done1log.write('done\n');

		}
	}

	function parseXML(text, who, msgnum) {

		/*for (var key in text.BML.REACH["@"]) {
		console.log(key);
		console.log(text.BML.REACH["@"][key]);
		}*/
		// parse text to figure out the function to call
		//	var reach = text.indexOf("<SBM:REACH");
		//	var move = text.indexOf("<LOCOMOTION");
		//	var gaze = text.indexOf("<GAZE");
		//	var gesture = text.indexOf("<GESTURE");
		//	var restoftext = null;
		//	var parsedText = null;
		var thischar = null;
		var thisobj = null;
		var target = null;
		var action = null;
		var lexeme = null;
		//var follow = null;
		var temp = null;
		var x = null;
		var y = null;
		if (text.BML != undefined) {
			//console.log(text.BML);
			if (text.BML.REACH != undefined) {
				for (var key in text.BML.REACH["@"]) {
					if (key == "ACTION") {
						action = text.BML.REACH["@"][key];
					} else if (key == "TARGET") {
						target = findItem('O', text.BML.REACH["@"][key]);
					}
				}
				if (action != null && target != null) {
					WAITINGON[WAITINGON.length] = curMsg;
					WAITING = true;
					//console.log("added message#"+curMsg);
					if (action == "PICK-UP") {
						who.pickup(curMsg, target, readyForNextMsg);
						//console.log("pickedup");
					} else {
						who.putdown(curMsg, target, readyForNextMsg);
						//console.log("putdown");
					}
					curMsg++;
				} else {
					console.log("Error reading REACH message");
					console.log(text.BML.REACH);
				}
				action = null;
				target = null;
			}
			if (text.BML.LOCOMOTION != undefined) {
				for (var key in text.BML.LOCOMOTION["@"]) {
					if (key == "TARGET") {
						temp = text.BML.LOCOMOTION["@"][key].split(" ");
						if (temp.length > 1) {
							// then have points not a target
							if (temp.length == 2) {
								// have one point
								x = temp[0];
								y = temp[1];
							} else {
								// have array
								x = new Array();
								y = new Array();
								for (var i = 0; i < temp.length; i = i + 2) {
									x[x.length] = temp[i];
									y[y.length] = temp[i + 1];
								}
							}
						} else {
							// have a target
							target = findItem('C', text.BML.LOCOMOTION["@"][key]);
							if (target == null) {
								target = findItem('O', text.BML.LOCOMOTION["@"][key]);
							}
						}
					} else if (key == "FOLLOW") {
						target = findItem('C', text.BML.LOCOMOTION["@"][key]);
					}
				}
				if (target != null) {
					WAITINGON[WAITINGON.length] = curMsg;
					WAITING = true;
					//console.log("added message#"+curMsg);
					who.locomotionTarget(curMsg, target, readyForNextMsg);
					curMsg++;
				} else if (x != null) {
					WAITINGON[WAITINGON.length] = curMsg;
					WAITING = true;
					//console.log("added message#"+curMsg);
					who.locomotionPt(curMsg, x, y, readyForNextMsg);
					curMsg++;
				} else {
					console.log("ERROR reading LOCOMOTION message");
					console.log(text.BML.LOCOMOTION);
				}
				target = null;
				x = null;
				y = null;
				temp = null;
			}
			if (text.BML.GAZE != undefined) {
				for (var key in text.BML.GAZE["@"]) {
					if (key == "TARGET") {
						temp = text.BML.GAZE["@"][key].split(" ");
						if (temp.length > 1) {
							x = temp[0];
							y = temp[1];
						} else {
							target = findItem('C', text.BML.GAZE["@"][key]);
							if (target == null) {
								target = findItem('O', text.BML.GAZE["@"][key]);
							}
						}
					}
				}
				if (target != null) {
					WAITINGON[WAITINGON.length] = curMsg;
					WAITING = true;
					//console.log("added message#"+curMsg);
					who.lookAtTarget(curMsg, target, readyForNextMsg);
					curMsg++;
				} else if (x != null) {
					WAITINGON[WAITINGON.length] = curMsg;
					WAITING = true;
					//console.log("added message#"+curMsg);
					who.lookAtPt(curMsg, x, y, readyForNextMsg);
					curMsg++;
				} else {
					console.log("ERROR reading GAZE message");
					console.log(text.BML.GAZE);
				}
				target = null;
				x = null;
				y = null;
				temp = null;
			}
			if (text.BML.GESTURE != undefined) {
				for (var key in text.BML.GESTURE["@"]) {
					if (key == "TARGET") {
						temp = text.BML.GESTURE["@"][key].split(" ");
						if (temp.length > 1) {
							x = temp[0];
							y = temp[1];
						} else {
							target = findItem('C', text.BML.GESTURE["@"][key]);
							if (target == null) {
								target = findItem('O', text.BML.GESTURE["@"][key]);
							}
						}
					} else if (key == "LEXEME") {
						if (text.BML.GESTURE["@"][key] == "POINT") {
							lexeme = text.BML.GESTURE["@"][key];
						} // ignore if not pointing in 2D won't matter
					}
				}
				if (target != null && lexeme != null) {
					WAITINGON[WAITINGON.length] = curMsg;
					WAITING = true;
					//console.log("added message#"+curMsg);
					who.pointAtTarget(curMsg, target, readyForNextMsg);
					curMsg++;
				} else if (x != null && lexeme != null) {
					WAITINGON[WAITINGON.length] = curMsg;
					WAITING = true;
					//console.log("added message#"+curMsg);
					who.pointAtPoint(curMsg, x, y, readyForNextMsg);
					curMsg++;
				} else {
					console.log("ERROR reading GESTURE message");
					console.log(text.BML.GESTURE);
				}
				target = null;
				x = null;
				y = null;
				lexeme = null;
			}
			/*restoftext = text.substring(reach+11);//, text.length - reach -11 - 15);
			 console.log(restoftext);
			 parsedText = restoftext.split(" ");
			 target = null;
			 action = null;
			 for (var i = 0; i < parsedText.length; i++) {
			 console.log("parsed"+i+"="+parsedText[i]);
			 if (parsedText[i].substring(0, 10) == "SBM:ACTION") {
			 action=parsedText[i].substring(10, parsedText[i].length - 10);
			 }
			 if (parsedText[i].substring(0,6) == "TARGET") {
			 var endpt = parsedText[i].substring(8).indexOf("\"");
			 target = parsedText[i].substring(8, endpt);
			 }
			 }
			 if (action != null && target != null) {
			 thischar = findItem('C', who);
			 thisobj = findItem('O', target);
			 WAITINGON[WAITINGON.length] = curMsg;
			 WAITING = true;
			 if (action == "PICKUP") {
			 thischar.pickup(curMsg, thisobj, readyForNextMsg);
			 console.log("pickedup");
			 } else {
			 thischar.putdown(curMsg, thisobj, readyForNextMsg);
			 console.log("putdown");
			 }
			 curMsg++;
			 thischar = null;
			 thisobj = null;
			 }*/
			if (text.BML.REACH == undefined && text.BML.LOCOMOTION == undefined && text.BML.GAZE == undefined && text.BML.GESTURE == undefined) {
				console.log("ERROR reading message - unknown BML command");
				console.log(text.BML);
			}
		} else {
			console.log("ERROR reading message - no BML element");
			console.log(text);
		}

	}

	function readLine() {
		//console.log("in readline");
		var remaining = '';

		inputFile.on('data', function(data) {
			remaining += data;
			//console.log(data);
			var index = remaining.indexOf('\n');
			while (index > -1) {
				var line = remaining.substring(0, index);
				remaining = remaining.substring(index + 1);
				if (line.indexOf('\n') == 0) {
					// skip blank lines
				} else {
					saveLine(line);
				}
				index = remaining.indexOf('\n');
			}
		});

		inputFile.on('end', function() {
			if (remaining.length > 0) {
				saveLine(remaining);
				inputFile.close();
			}
			if (BML) {
				nextLine();
				// for BML processing
			} else {
				mvmtlines = new Array(ALLDATA.length);
				myctr = new Array(ALLDATA.length);
				mytype = new Array(ALLDATA.length);
				parseLine();
				// for natural language processing
			}
		});
	}

	function saveLine(data) {
		data = data.replace(/^\s+|\s+$/g, "");
		// trim front & end for easier parsing checks
		var temp = data.split(" ");
		if (isMvmtLine(data)) {
			// this is an action - save in uppercase
			data = data.toUpperCase();
		} else {
			var nchar = isCharLine(data);
			if (nchar != null) {
				// this is a character definition - save in uppercase
				data = data.toUpperCase();
			} // otherwise is speech, so don't convert the text
		}
		if (data.length != 0) {
			ALLDATA[ALLDATA.length] = data;
			// save it to the array
		}
		// console.log("ALLDATA="+ ALLDATA[ALLDATA.length-1]);
	}

	function findItem(type, name) {
		if (type == 'C') {
			// loop through all chars
			for (var i = 0; i < characters.length; i++) {
				if (characters[i].name == name) {
					//console.log("finditem C gives "+name);
					return characters[i];
				}
			}
		} else {
			// loop through all objects
			for (var j = 0; j < pawns.length; j++) {
				if (pawns[j].name == name) {
					//console.log("finditem O gives "+name);
					return pawns[j];
				}
			}
		}
		// error!!
		//console.log("couldn't find " + type + " with name=" + name);
		return null;
	}

	function Character(name, x, y, angle, color, neg) {
		this.name = name;
		this.x = -1 * (x - 2312) / 2;
		// to adjust for different dimensions for Unity vs JS
		this.y = (y - 209) / 2;
		// to adjust for different dimensions for Unity vs JS
		this.angle = angle;
		this.r = characterSize;
		//		this.fs = 'rgba(' + color + ', 1.0)';
		this.item = null;
		this.pointTo = null;
		this.pointAngle = 0;
		this.gazeTo = null;
		this.turning = false;
		this.moveTo = null;
		this.xold = this.x;
		this.yold = this.y;
		this.angleold = this.angle;
		this.pointToold = this.pointTo;
		this.pointAngleold = this.pointAngle;
		if (characters == null) {
			characters = new Array();
			characters[0] = this;
		} else {
			characters[characters.length] = this;
		}
		if (allObjects == null) {
			allObjects = new Array();
			allObjects[0] = this;
		} else {
			allObjects[allObjects.length] = this;
		}
		//var filesystemobj = new ActiveXObject("Scripting.FileSystemObject");
		//this.logfile = filesystemobj.OpenTextFile(logpath+this.name+".log");
		//this.logfile.WriteLine((new Date().time).ToString()+"\tFileOpened");
		/*var d = new Date();
		 var filename = "CHAR-" + (d.getMonth() + 1 ) + "." + d.getDate() + "." + d.getFullYear() + " " + d.getHours() + "." + d.getMinutes() + "." + d.getSeconds();
		 var log = fs.createWriteStream('logs/' + this.name + '-' + filename + '.csv', {
		 'flags' : 'a'
		 });
		 log.write('time,x,y,rot,pointangle\n');*/

		this.update = function() {
			// log current location & time to file
			var temp = null;
			//this.logfile.WriteLine((new Date().time).ToString()+"\t"+this.x+"\t"+this.y+"\t"+this.angle);

			// check moveTo target to see if it moved & adjust
			if (this.moveTo != null && (this.moveTo instanceof Character || this.moveTo instanceof Pawn)) {
				// calc angle & save
				temp = Math.atan2(this.y - this.moveTo.y, this.moveTo.x - this.x) + Math.PI / 2;
				if (this.angle != temp) {
					this.angleold = this.angle;
					this.angle = temp;
				}
			} else if (this.moveTo != null && !(this.moveTo instanceof Character || this.moveTo instanceof Pawn)) {
				// do nothing because moving to a specific point and need to look at the point, not the gaze for now
			} else if (this.gazeTo != null && (this.gazeTo instanceof Character || this.gazeTo instanceof Pawn) && !this.turning) {// check gaze target to see if it moved & adjust
				// calc angle & save
				temp = Math.atan2(this.y - this.gazeTo.y, this.gazeTo.x - this.x) + Math.PI / 2;
				if (this.angle != temp) {
					this.angleold = this.angle;
					this.angle = temp;
				}
			}

			// check point target to see if it moved & adjust
			if (this.pointTo != null && (this.pointTo instanceof Character || this.pointTo instanceof Pawn)) {
				// calc angle & save
				temp = Math.atan2(this.y - this.pointTo.y, this.pointTo.x - this.x) + Math.PI / 2;
				if (this.pointAngle != temp) {
					this.pointAngleold = this.pointAngle;
					this.pointAngle = temp;
				}
			}
			createUpdMsg("CHAR", this);
			//log.write((new Date().getTime()).toString() + ',' + this.x + ',' + this.y + ',' + this.angle + ',' + ((this.pointTo == null) ? ("") : (this.pointAngle)) + '\n');
		}

		this.onstage = function() {

			var maxx = -1 * (193 - 2312) / 2;
			// to adjust for different dimensions for Unity vs JS
			var miny = (209 - 209) / 2;
			var minx = -1 * (2313 - 2312) / 2;
			var maxy = (2042 - 209) / 2;
			//console.log("Comparing "+mychar.name+" at ("+mychar.x+","+mychar.y+") to ("+minx+"-"+maxx+","+miny+"-"+maxy+")");
			if (this.x > minx && this.x < maxx) {
				if (this.y > miny && this.y < maxy) {
					//console.log("Char target is onstage "+this.name + ": ["+this.x+","+this.y+"]");
					return true;
				}
			}
			//console.log("Char target is NOT onstage "+this.name + ": ["+this.x+","+this.y+"]");
			return false;

			/*
			 if((x > -1 * (193 - 2312) / 2) && (x < -1 * (2313 - 2312) / 2) && (y > (209 - 209) / 2) && (y < (2042 - 209) / 2)) {
			 return true;
			 }
			 return false;*/
		}

		this.Step = function(msgnum, targetx, targety, targetAngle, callbackFunc) {
			//console.log("In Step, msgnum=" + msgnum + " for " + this.name);
			// check if target moved on us first
			var temp = null;
			if (this.moveTo instanceof Character || this.moveTo instanceof Pawn) {
				//console.log("Step "+msgnum+" moveto instanceof object");
				temp = Math.atan2(this.y - this.moveTo.y, this.moveTo.x - this.x) + Math.PI / 2;
				//Math.atan2(this.y - y, x - this.x) + Math.PI/2;
				targetAngle = temp;
				// look in direction moving
				if (this.angle != temp) {
					this.angleold = this.angle;
					this.angle = targetAngle;
				}
				var distance = Math.sqrt(((this.x - this.moveTo.x) * (this.x - this.moveTo.x)) + ((this.y - this.moveTo.y) * (this.y - this.moveTo.y)));
				if (this.moveTo instanceof Character) {
					// update target to within 44
					distance = distance - (characterSize * 2);
					targetx = this.x + (distance * Math.sin(targetAngle));
					targety = this.y + (distance * Math.cos(targetAngle));
				} else {
					// update target to within 10
					distance = distance - objectSize - characterSize;
					targetx = this.x + (distance * Math.sin(targetAngle));
					targety = this.y + (distance * Math.cos(targetAngle));
				}
			}
			if ( targetx instanceof Array) {
				//console.log("Step "+msgnum+" target instanceof array");
				//console.log("Moving array, current pt=("+this.x+","+this.y+"), target=("+targetx[0]+","+targety[0]+")");
				if (this.x == targetx[0] && this.y == targety[0]) {// reached current destination
					//console.log("Step "+msgnum+" target instanceof array at destination");
					targetx.splice(0, 1);
					targety.splice(0, 1);
					if (targetx.length == 0) {// no more destinations left
						//console.log("Step "+msgnum+" moveto instanceof array at destination and no more destinations");
						this.moveTo = null;
						callbackFunc(msgnum);
					} else {// more destinations left
						//console.log("Step "+msgnum+" moveto instanceof array at destination and more destinations");
						temp = Math.atan2(this.y - targety[0], targetx[0] - this.x) + Math.PI / 2;
						targetAngle = temp;
						if (this.angle != temp) {
							this.angleold = this.angle;
							this.angle = targetAngle;
						}
						this.moveTo = "Point " + targetx[0] + "," + targety[0];
						//console.log("First Step, target=("+targetx[0]+","+targety[0]+")");
						this.Step(msgnum, targetx, targety, targetAngle, callbackFunc);
					}
				} else {// haven't reached current destination yet
					//console.log("Step "+msgnum+" moveto instanceof array NOT at destination");
					// set value, then wait to repeat
					if (Math.sin(targetAngle) < 0) {
						this.xold = this.x;
						this.x = Math.max(this.x + (moveDist * Math.sin(targetAngle)), targetx[0]);
					} else {
						this.xold = this.x;
						this.x = Math.min(this.x + (moveDist * Math.sin(targetAngle)), targetx[0]);
					}
					if (Math.cos(targetAngle) < 0) {
						this.yold = this.y;
						this.y = Math.max(this.y + (moveDist * Math.cos(targetAngle)), targety[0]);
					} else {
						this.yold = this.y;
						this.y = Math.min(this.y + (moveDist * Math.cos(targetAngle)), targety[0]);
					}
					var xthis = this;
					var xmsgnum = msgnum;
					var xtargetx = targetx;
					var xtargety = targety;
					var xtargetAngle = targetAngle;
					var xcallbackFunc = callbackFunc;
					TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
						//console.log("Step "+xmsgnum+" in callback for moveto instanceof array NOT at destination");
						xthis.Step(xmsgnum, xtargetx, xtargety, xtargetAngle, xcallbackFunc);
						xthis = null;
						xmsgnum = null;
						xtargetx = null;
						xtargety = null;
						xtargetAngle = null;
						xcallbackFunc = null;
					}, stepTime);
				}
			} else {
				//console.log("Step "+msgnum+" moveto NOT instanceof array");
				if (this.x == targetx && this.y == targety) {
					//console.log("Step "+msgnum+" moveto NOT instanceof array and at destination "+callbackFunc.toString());
					this.moveTo = null;

					callbackFunc(msgnum);

				} else {
					//console.log("Step "+msgnum+" moveto NOT instanceof array and NOT at destination");
					// set value, then wait to repeat
					if (Math.sin(targetAngle) < 0) {
						this.xold = this.x;
						this.x = Math.max(this.x + (moveDist * Math.sin(targetAngle)), targetx);
					} else {
						this.xold = this.x;
						this.x = Math.min(this.x + (moveDist * Math.sin(targetAngle)), targetx);
					}
					if (Math.cos(targetAngle) < 0) {
						this.yold = this.y;
						this.y = Math.max(this.y + (moveDist * Math.cos(targetAngle)), targety);
					} else {
						this.yold = this.y;
						this.y = Math.min(this.y + (moveDist * Math.cos(targetAngle)), targety);
					}
					var xthis = this;
					var xmsgnum = msgnum;
					var xtargetx = targetx;
					var xtargety = targety;
					var xtargetAngle = targetAngle;
					var xcallbackFunc = callbackFunc;
					TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
						//console.log("Step "+xmsgnum+" in callback for moveto NOT instanceof array and NOT at destination");
						xthis.Step(xmsgnum, targetx, targety, targetAngle, callbackFunc);
						xthis = null;
						xmsgnum = null;
						xtargetx = null;
						xtargety = null;
						xtargetAngle = null;
						xcallbackFunc = null;
					}, stepTime);
				}
			}
			//console.log("Step "+msgnum+" exiting function");
			createUpdMsg("CHAR", this);
		}

		this.locomotionPt = function(msgnum, x, y, callbackFunc) {
			//console.log("In locomotion Pt " + msgnum + " for " + this.name);
			// assume x & y are arrays so can go to multiple points in one call
			var targetAngle = 0;
			if (this.moveTo != null) {
				//console.log("locomotionPt "+msgnum+" moveto not null");
				var xthis = this;
				var xmsgnum = msgnum;
				var xx = x;
				var xy = y;
				var xcallbackFunc = callbackFunc;
				TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
					xthis.locomotionPt(xmsgnum, xx, xy, xcallbackFunc);
					xthis = null;
					xmsgnum = null;
					xy = null;
					xx = null;
					xcallbackFunc = null;
				}, 65);
			} else {
				//console.log("locomotionPt "+msgnum+" else for moveto not null");

				//console.log("Moving to ["+x+","+y+"]");

				if ( x instanceof Array) {
					//console.log("locomotionPt "+msgnum+" else for moveto not null and instanceof array");
					// array of values
					/*for (var i = 0; i < x.length; i++) {
					targetAngle = Math.atan2(this.y - y[i], x[i] - this.x) + Math.PI/2;
					while (this.x != x[i] && this.y != y[i]) {
					this.x = min(this.x + (moveDist*Math.sin(targetAngle)), x[i]);
					this.y = min(this.y + (moveDist*Math.cos(targetAngle)), y[i]);
					}
					}*/
					// clean up point values:
					for (var i = 0; i < x.length; i++) {
						x[i] = -1 * (x[i] - 2312) / 2;
						y[i] = (y[i] - 209) / 2;
					}
					targetAngle = Math.atan2(this.y - y[0], x[0] - this.x) + Math.PI / 2;

					this.angleold = this.angle;
					this.angle = targetAngle;
					this.moveTo = "Point " + x[0] + "," + y[0];
					//var xthis = this;
					//	this.turnSome(msgnum, 'M', targetAngle, function() { xthis.Step(msgnum, x, y, targetAngle, callbackFunc); xthis = null;});

					this.Step(msgnum, x, y, targetAngle, callbackFunc);
				} else {
					//console.log("locomotionPt "+msgnum+" else for moveto not null and NOT instanceof array");
					x = -1 * (x - 2312) / 2;
					// clean up point values
					y = (y - 209) / 2;
					// cleanup point values
					// only one value
					// get angle
					targetAngle = Math.atan2(this.y - y, x - this.x) + Math.PI / 2;
					//Math.atan2(this.y - y, x - this.x) + Math.PI/2;
					// look in direction moving
					this.angleold = this.angle;
					this.angle = targetAngle;
					this.moveTo = "Point " + x + "," + y;
					//var xthis = this;
					//this.turnSome(msgnum, 'M', targetAngle, function() {xthis.Step(msgnum, x, y, targetAngle, callbackFunc); xthis = null;});

					this.Step(msgnum, x, y, targetAngle, callbackFunc);
				}
				//console.log("locomotionPt "+msgnum+" moveto not null - create upd message");
				createUpdMsg("CHAR", this);
			}
			//console.log("locomotionPt "+msgnum+" exiting function");
		}

		this.locomotionTarget = function(msgnum, item, callbackFunc) {
			//console.log("In locomotionTarget " + msgnum);
			var targetx = 0;
			var targety = 0;
			var targetAngle = 0;
			var xthis = this;
			if (this.moveTo != null) {
				var xthis = this;
				var xmsgnum = msgnum;
				var xitem = item;
				var xcallbackFunc = callbackFunc;
				TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
					xthis.locomotionTarget(xmsgnum, xitem, xcallbackFunc);
					xthis = null;
					xmsgnum = null;
					xitem = null;
					xcallbackFunc = null;
				}, 65);
			} else {

				// stop just before reaching target by 44 if item is person, by 10 if object
				targetAngle = 0;
				var isCharacter = ( item instanceof Character);
				targetAngle = Math.atan2(this.y - item.y, item.x - this.x) + Math.PI / 2;
				//Math.atan2(this.y - y, x - this.x) + Math.PI/2;
				this.moveTo = item;

				//this.turnSome(msgnum, 'M', targetAngle, function() {
				// look in direction moving
				//this.angleold = this.angle;
				//this.angle = targetAngle;
				targetx = 0;
				targety = 0;
				var distance = Math.sqrt(((xthis.x - item.x) * (xthis.x - item.x)) + ((xthis.y - item.y) * (xthis.y - item.y)));
				if (isCharacter) {
					// update target to within 44
					distance = distance - (characterSize * 2);
					targetx = xthis.x + (distance * Math.sin(targetAngle));
					targety = xthis.y + (distance * Math.cos(targetAngle));
				} else {
					// update target to within 10
					distance = distance - objectSize - characterSize;
					targetx = xthis.x + (distance * Math.sin(targetAngle));
					targety = xthis.y + (distance * Math.cos(targetAngle));
				}
				// call the first step

				//this.gazeTo = null;
				xthis.Step(msgnum, targetx, targety, targetAngle, callbackFunc);
				xthis = null;
				//});
				createUpdMsg("CHAR", this);
			}
		}

		this.pickup = function(msgnum, item, callbackFunc) {
			//console.log("In pickup " + msgnum);
			if ( item instanceof Pawn && item.moveable) {
				this.item = item;
				item.ownedby = this;
			}
			var xcallbackFunc = callbackFunc;
			var xmsgnum = msgnum;
			TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
				xcallbackFunc(xmsgnum);
				xcallbackFunc = null;
				xmsgnum = null;
			}, pickupTime);
			createUpdMsg("CHAR", this);

		}

		this.putdown = function(msgnum, item, callbackFunc) {
			//console.log("In putdown " + msgnum);
			if (this.item == item) {
				this.item = null;
				item.ownedby = null;
			}
			var xcallbackFunc = callbackFunc;
			var xmsgnum = msgnum;
			TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
				xcallbackFunc(xmsgnum);
				xcallbackFunc = null;
				xmsgnum = null;
			}, pickupTime);
			createUpdMsg("CHAR", this);
		}

		this.lookAtPt = function(msgnum, x, y, callbackFunc) {
			//console.log("In lookAtPt " + msgnum);
			if (this.turning) {
				var xthis = this;
				var xmsgnum = msgnum;
				var xx = x;
				var xy = y;
				var xcallbackFunc = callbackFunc;
				TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
					xthis.lookAtPt(xmsgnum, xx, xy, xcallbackFunc);
					xthis = null;
					xmsgnum = null;
					xy = null;
					xx = null;
					xcallbackFunc = null;
				}, 65);
			} else {
				x = -1 * (x - 2312) / 2;
				// cleanup values
				y = (y - 209) / 2;
				// cleanup point values
				var targetAngle = Math.atan2(this.y - y, x - this.x) + Math.PI / 2;
				//			this.angleold = this.angle;
				//			this.angle = Math.atan2(this.y - y, x - this.x) + Math.PI/2;
				this.gazeTo = "Point " + x + "," + y;
				this.turning = true;
				if (this.angle != targetAngle) {
					this.turnSome(msgnum, 'G', targetAngle, callbackFunc);
				} else {
					this.turning = false;
					//callbackFunc(msgnum);
					var xcallbackFunc = callbackFunc;
					var xmsgnum = msgnum;
					TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
						xcallbackFunc(xmsgnum);
						xcallbackFunc = null;
						xmsgnum = null;
					}, 100);
				}
				//			TIMEOUTS[TIMEOUTS.length] = setTimeout(function(){callbackFunc(msgnum)},lookatTime);
				createUpdMsg("CHAR", this);
			}
		}

		this.turnSome = function(msgnum, type, targetAngle, callbackFunc) {
			// if turn amount is > 180 from current, then turn right - else turn left since angle goes in counterclockwise direction increasing
			//console.log(this.name + " curangle="+this.angle+", targetangle="+targetAngle);
			// check if target moved & update targetAngle based on that
			var temp;
			//var targetAngle;
			if (type == 'G') {
				if (this.gazeTo instanceof Character || this.gazeTo instanceof Pawn) {
					targetAngle = Math.atan2(this.y - this.gazeTo.y, this.gazeTo.x - this.x) + Math.PI / 2;
					//Math.atan2(this.y - y, x - this.x) + Math.PI/2;
					//console.log("char gaze: target angle updated to "+targetAngle);
					//targetAngle = temp;
				}
			}
			// convert targetAngle to a positive value
			if (targetAngle > Math.PI * 2) {
				targetAngle = targetAngle - Math.PI * 2;
				//console.log("bigger: target angle to:"+targetAngle);
			} else if (targetAngle < 0) {
				targetAngle = targetAngle + Math.PI * 2;
				//console.log("smaller: target angle to:"+targetAngle);
			}
			if (this.angle == targetAngle) {
				// done - stop moving!
				//console.log("Done looking");
				this.turning = false;
				callbackFunc(msgnum);
			} else {
				if (Math.abs(targetAngle - this.angle) <= turnDist) {
					temp = targetAngle;
					this.angleold = this.angle;
					this.angle = temp;
					this.turning = false;
					callbackFunc(msgnum);
					//console.log("less than turn dist, temp="+temp);
				} else if (Math.abs(targetAngle - this.angle) > Math.PI) {
					// turn right, so subtract, but check for hitting 0
					if (this.angle > targetAngle) {
						temp = this.angle + turnDist;
					} else {
						temp = this.angle - turnDist;
					}
					//	console.log("more than 180, temp="+temp);
					/*	// check to see if you passed it & if so, make temp = targetAngle
					 if (temp < 0) {
					 temp = temp + Math.PI*2;
					 }
					 if (this.angle > targetAngle && targetAngle > temp) {
					 temp = targetAngle;
					 } else if (this.angle < targetAngle && targetAngle < temp) {
					 temp = targetAngle;
					 }*/
					if (temp < 0) {
						this.angleold = this.angle;
						this.angle = temp + Math.PI * 2;
					} else if (temp > Math.PI * 2) {
						this.angleold = this.angle;
						this.angle = temp - Math.PI * 2;
					} else {
						this.angleold = this.angle;
						this.angle = temp;
					}
					//	console.log("angle updated to:"+this.angle);
					var xthis = this;
					var xmsgnum = msgnum;
					var xtype = type;
					var xtargetAngle = targetAngle;
					var xcallbackFunc = callbackFunc;
					TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
						xthis.turnSome(msgnum, type, targetAngle, callbackFunc);
						xthis = null;
						xmsgnum = null;
						xtype = null;
						xtargetAngle = null;
						xcallbackFunc = null;
					}, lookatTime);
				} else {
					// turn left, so add, but check for hitting 2PI
					if (this.angle > targetAngle) {
						temp = this.angle - turnDist;
					} else {
						temp = this.angle + turnDist;
					}
					//console.log("less than 180, temp="+temp);
					// check to see if you passed it & if so, make temp = targetAngle
					/*if (temp > Math.PI*2) {
					 temp = temp - Math.PI*2;
					 }
					 if (this.angle > targetAngle && targetAngle > temp) {
					 temp = targetAngle;
					 } else if (this.angle < targetAngle && targetAngle < temp) {
					 temp = targetAngle;
					 }*/
					if (temp > Math.PI * 2) {
						this.angleold = this.angle;
						this.angle = temp - Math.PI * 2;
					} else if (temp < 0) {
						this.angleold = this.angle;
						this.angle = temp + Math.PI * 2;
					} else {
						this.angleold = this.angle;
						this.angle = temp;
					}
					//	console.log("angle updated to:"+this.angle);
					var xthis = this;
					var xmsgnum = msgnum;
					var xtype = type;
					var xtargetAngle = targetAngle;
					var xcallbackFunc = callbackFunc;
					TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
						xthis.turnSome(xmsgnum, xtype, xtargetAngle, xcallbackFunc);
						xthis = null;
						xmsgnum = null;
						xtype = null;
						xtargetAngle = null;
						xcallbackFunc = null;
					}, lookatTime);
				}

			}

			createUpdMsg("CHAR", this);
		}

		this.lookAtTarget = function(msgnum, item, callbackFunc) {
			//console.log("In lookAtTarget " + msgnum);
			//console.log("looking by "+this.name);
			if (this.turning) {
				var xthis = this;
				var xmsgnum = msgnum;
				var xitem = item;
				var xcallbackFunc = callbackFunc;
				TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
					xthis.lookAtTarget(xmsgnum, xitem, xcallbackFunc);
					xthis = null;
					xmsgnum = null;
					xitem = null;
					xcallbackFunc = null;
				}, 65);
			} else {
				var targetAngle = Math.atan2(this.y - item.y, item.x - this.x) + Math.PI / 2;
				this.turning = true;
				//			this.angleold = this.angle;
				//			this.angle = Math.atan2(this.y - item.y, item.x - this.x) + Math.PI/2;
				this.gazeTo = item;
				if (this.angle != targetAngle) {
					this.turnSome(msgnum, 'G', targetAngle, callbackFunc);
				} else {
					//console.log("already looking, cancelling");
					this.turning = false;
					//callbackFunc(msgnum);
					var xcallbackFunc = callbackFunc;
					var xmsgnum = msgnum;
					TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
						xcallbackFunc(xmsgnum);
						xcallbackFunc = null;
						xmsgnum = null;
					}, 100);
				}
				//			TIMEOUTS[TIMEOUTS.length] = setTimeout(function(){callbackFunc(msgnum)},lookatTime);
				createUpdMsg("CHAR", this);
			}
		}

		this.stopPointing = function() {
			this.pointToold = this.pointTo;
			this.pointTo = null;
			this.pointAngleold = this.pointAngle;
			this.pointAngle = 0;
			createUpdMsg("CHAR", this);
		}

		this.pointAtPoint = function(msgnum, x, y, callbackFunc) {
			//console.log("In pointAtPoint " + msgnum);
			if (this.pointTo != null) {
				var xthis = this;
				var xmsgnum = msgnum;
				var xx = x;
				var xy = y;
				var xcallbackFunc = callbackFunc;
				TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
					xthis.pointAtPoint(xmsgnum, xx, xy, xcallbackFunc);
					xthis = null;
					xmsgnum = null;
					xx = null;
					xy = null;
					xcallbackFunc = null;
				}, 65);
			} else {
				// find the angle to the point & save as this.pointAngle
				x = -1 * (x - 2312) / 2;
				// cleanup points
				y = (y - 209) / 2;
				// cleanup point values
				this.pointToold = this.pointTo;
				this.pointAngleold = this.pointAngle;
				this.pointTo = "Point " + x + "," + y;
				this.pointAngle = Math.atan2(this.y - y, x - this.x) + Math.PI / 2;
				//*180/Math.PI;
				var xthis = this;
				TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
					xthis.stopPointing();
					xthis = null;
				}, pointTime);
				var xcallbackFunc = callbackFunc;
				var xmsgnum = msgnum;
				TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
					xcallbackFunc(xmsgnum);
					xcallbackFunc = null;
					xmsgnum = null;
				}, pointTime);
				createUpdMsg("CHAR", this);
			}
		}

		this.pointAtTarget = function(msgnum, item, callbackFunc) {
			//console.log("In pointAtTarget " + msgnum);
			if (this.pointTo != null) {
				var xthis = this;
				var xmsgnum = msgnum;
				var xitem = item;
				var xcallbackFunc = callbackFunc;
				TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
					xthis.pointAtTarget(xmsgnum, xitem, xcallbackFunc);
					xthis = null;
					xmsgnum = null;
					xitem = null;
					xcallbackFunc = null;
				}, 65);
			} else {
				// find the angle to the item & save as this.pointAngle
				this.pointToold = this.pointTo;
				this.pointAngleold = this.pointAngle;
				this.pointTo = item;
				this.pointAngle = Math.atan2(this.y - item.y, item.x - this.x) + Math.PI / 2;
				//*180/Math.PI;
				var xthis = this;
				TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
					xthis.stopPointing();
					xthis = null;
				}, pointTime);
				var xcallbackFunc = callbackFunc;
				var xmsgnum = msgnum;
				TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
					xcallbackFunc(xmsgnum);
					xcallbackFunc = null;
					xmsgnum = null;
				}, pointTime);
				createUpdMsg("CHAR", this);
			}
		}

		this.stopSpeaking = function() {
			//speechBox.innerHTML = "";
			//speakerBox.innerHTML = "";
			textBoxes.who = "";
			textBoxes.text = "";
			createUpdMsg("BOX", this);
		}

		this.sayone = function(msgnum, textarray, callbackFunc) {
			var xthis = this;
			var mytime = 0;
			//console.log(textarray);
			if (textarray.length == 0) {
				//TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {

				this.stopSpeaking();
				//xthis = null;
				callbackFunc(msgnum);
				//}, 100);
			} else {
				mytime = textarray[0].length;
				//console.log("*****************showing: " + textarray[0]);
				textBoxes.updateText(this.name, textarray[0]);
				createUpdMsg("BOX", this);
				textarray.splice(0, 1);
				var xmsgnum = msgnum;
				var xtextarray = textarray;
				var xcallbackFunc = callbackFunc;
				TIMEOUTS[TIMEOUTS.length] = setTimeout(function() {
					xthis.sayone(xmsgnum, xtextarray, xcallbackFunc);
					xthis = null;
					xmsgnum = null;
					xtextarray = null;
					xcallbackFunc = null;
				}, (mytime ) * sayTime);

			}
			//createUpdMsg("BOX", this);

		}
		this.say = function(msgnum, text, callbackFunc) {
			console.log("In say:" + msgnum + "-" + text);
			/*var stack = traceback();
			 for (var i = 0; i < stack.length; i++) {
			 console.log("In function " + stack[i].name + " on line " + stack[i].line);
			 }*/
			var splittext = splitLine(text);
			//console.log(splittext);
			this.sayone(msgnum, splittext, callbackFunc);
		}
	}// end of Character object

	function SpeechBox() {
		this.who = "";
		this.text = "";
		textBoxes = this;

		this.updateText = function(who, text) {
			this.who = who;
			this.text = text;
			//			speechBox.innerHTML = this.text;
			//			speakerBox.innerHTML = this.who;
			createUpdMsg("BOX", this);
		}
	}// end of SpeechBox object

	function Pawn(name, x, y, color, neg, moveable) {
		this.name = name;
		this.x = -1 * (x - 2312) / 2;
		// cleanup point values
		this.y = (y - 209) / 2;
		// cleanup point values
		this.r = objectSize;
		this.color = color;
		this.neg = neg;
		this.showcolor = this.neg;
		this.xold = this.x;
		this.yold = this.y;
		this.showcolorold = this.showcolor;
		this.ownedby = null;
		this.moveable = moveable;
		if (pawns == null) {
			pawns = new Array();
			pawns[0] = this;
		} else {
			pawns[pawns.length] = this;
		}
		if (allObjects == null) {
			allObjects = new Array();
			allObjects[0] = this;
		} else {
			allObjects[allObjects.length] = this;
		}
		if (this.moveable) {
			/*var dp = new Date();
			var filenamep = "PAWN-" + (dp.getMonth() + 1 ) + "." + dp.getDate() + "." + dp.getFullYear() + " " + dp.getHours() + "." + dp.getMinutes() + "." + dp.getSeconds();
			var logp = fs.createWriteStream('logs/' + this.name + '-' + filenamep + '.csv', {
			'flags' : 'a'
			});*/
			//logp.write('time,x,y,owner\n');
		}

		this.update = function() {
			if (this.moveable) {
				if (this.ownedby != null) {
					this.xold = this.x;
					this.x = this.ownedby.x - characterSize - objectSize;
					this.yold = this.y;
					this.y = this.ownedby.y;
					if (this.showcolor != this.color) {
						this.showcolorold = this.showcolor;
					}
					this.showcolor = this.color;
				} else if (this.showcolor != this.neg) {
					this.showcolorold = this.showcolor;
					this.showcolor = this.neg;
				}
				createUpdMsg("PAWN", this);
				//logp.write((new Date().getTime()).toString() + ',' + this.x + ',' + this.y + ',' + ((this.showcolor == this.neg) ? ("") : (this.ownedby.name)) + '\n');
			}
		}
	}// end of Object object

	function worldUpdate() {
		for (var i = 0; i < allObjects.length; i++) {
			allObjects[i].update();
		}
	}

	// Line Splitter Function
	// copyright Stephen Chapman, 19th April 2006
	// you may copy this code but please keep the copyright notice as well
	function splitLine(st) {
		var n = 25;
		var stringarray = [];
		//var b = '';
		var s = st;
		while (s.length > n) {
			var c = s.substring(0, n);
			var d = c.lastIndexOf(' ');
			var e = c.lastIndexOf('\n');
			//if (e != -1)
			//d = e;
			if (d == -1)
				d = n;
			stringarray[stringarray.length] = c.substring(0, d);
			s = s.substring(d + 1);
		}
		stringarray[stringarray.length] = s;
		return stringarray;
	}

	//********************************************
	//* Start of main code
	//********************************************

	new SpeechBox();
	// create pawns
	var shovel = new Pawn('SHOVEL', 635 - 50, 100, '0, 0, 0', '234, 234, 234', true);
	var grave = new Pawn('GRAVE', 1571, 914, '0, 0, 0', '234, 234, 234', false);
	var skull1 = new Pawn('SKULL1', 1571 - 5, 914, '0, 0, 0', '234, 234, 234', true);
	var skull2 = new Pawn('SKULL2', 1571 + 5, 914, '0, 0, 0', '234, 234, 234', true);
	var lantern = new Pawn('LANTERN', 1041, 100, '0, 0, 0', '234, 234, 234', true);
	var audience = new Pawn('AUDIENCE', 1253, 2641, '255,255,255', '255,255,255', false);
	var centerbackstage = new Pawn('CENTERBACKSTAGE', 1000, 209, '255,255,255', '255,255,255', false);
	var stageright = new Pawn('STAGERIGHT', 2500, 1250, '255,255,255', '255,255,255', false);
	var steps = new Pawn('STEPS', 1100, 1125, '255,255,255', '255,255,255', false);
	var center = new Pawn('CENTER', 1253, 1055, '255,255,255', '255,255,255', false);
	var upstage = new Pawn('UPSTAGE', 1253, 209, '255,255,255', '255,255,255', false);
	var downstage = new Pawn('DOWNSTAGE', 1253, 2042, '255,255,255', '255,255,255', false);
	var stageleft = new Pawn('STAGELEFT', 193, 1020, '255,255,255', '255,255,255', false);
	var stool = new Pawn('STOOL', 1147, 1760, '255,255,255', '255,255,255', false);
	var centerright = new Pawn('CENTERRIGHT', 1900, 1020, '255,255,255', '255,255,255', false);
	// create characters
	//var gravedigger1 = new Character('GRAVEDIGGER1', 1465, 632, 0, '135,206,250', '0,0,128');
	//var gravedigger2 = new Character('GRAVEDIGGER2', 1253, 1478, 0, '171,130,255', '85,26,139');
	//var hamlet = new Character('HAMLET', 935, 1020, 0, '0,205,0', '0,100,0');
	//var horatio = new Character('HORATIO', 1677, 1196, 0, '233,150,122', '139,69,0');

	var gravedigger1 = new Character('GRAVEDIGGER1', 1041, 100, 0, '135,206,250', '0,0,128');
	var gravedigger2 = new Character('GRAVEDIGGER2', 935, 100, 0, '171,130,255', '85,26,139');
	var hamlet = new Character('HAMLET', 1147, 100, 0, '0,205,0', '0,100,0');
	var horatio = new Character('HORATIO', 1253, 100, 0, '233,150,122', '139,69,0');

	for (var i = 0; i < allObjects.length; i++) {
		console.log("Position of " + allObjects[i].name + " = [" + allObjects[i].x + "," + allObjects[i].y + "]");
	}
	//var nobody = new Character('NOBODY', 935, 1020, Math.PI*3/2, '255,255,255', '0,0,0');

	INTERVAL_ID = setInterval(worldUpdate, framerate);

	textBoxes.updateText("", "");
	// this is to initialize client to the same as server immediately
	var msg = "";
	var mynames = ["SHOVEL", "SKULL1", "SKULL2", "LANTERN", "HAMLET", "HORATIO", "GRAVEDIGGER1", "GRAVEDIGGER2"];
	for (var i = 0; i < allObjects.length; i++) {

		if (allObjects[i] instanceof Character) {
			msg = "CHAR" + "\t" + allObjects[i].name + "\t" + allObjects[i].x + "\t" + allObjects[i].y + "\t" + allObjects[i].angle + "\t" + ((allObjects[i].pointTo == null) ? ("null") : ((allObjects[i] instanceof Pawn) ? (allObjects[i].name) : (allObjects[i]))) + "\t" + allObjects[i].pointAngle;
		} else {
			msg = "PAWN" + "\t" + allObjects[i].name + "\t" + allObjects[i].x + "\t" + allObjects[i].y + "\t" + allObjects[i].showcolor;
		}
		if (mynames.indexOf(allObjects[i].name) != -1) {
			server.sendMsg(msg);
		}
	}
	readLine();
	// this just gets the data into the array

	/*gravedigger1.locomotionPt('CJT12', 1041, 432, function() {
	 gravedigger2.locomotionPt('CJT13', 1571, 900, function() {
	 gravedigger1.lookAtTarget('CJT14', grave, function() {
	 gravedigger2.lookAtPt('CJT15', 511, 1619, function() {
	 gravedigger1.lookAtPt('CJT15', 511, 209, function() {
	 gravedigger2.lookAtPt('CJT16', 2101, 632, function() {
	 console.log("Done looking");});
	 });
	 });
	 });
	 });
	 });
	 */

	/*
	 // start file parsing & sending messages to characters/pawns
	 gravedigger1.locomotionPt('CJT12', 1041, 632, function() {
	 gravedigger2.locomotionPt('CJT12', 1571, 900, function() {
	 horatio.locomotionPt('CJT12', 1783, 1478, function() {
	 hamlet.locomotionPt('CJT12', 617, 1619, function() {
	 gravedigger1.pickup('CJT12', lantern, function other() {console.log("Done lifting");});
	 gravedigger2.lookAtTarget('CJT12', audience, function other() {console.log("Done looking g2 to aud")});
	 horatio.lookAtTarget('CJT12', hamlet, function other() {console.log("Done looking ho to ha")});
	 gravedigger1.say('CJT12', "To be or not to be. That is the questionTo be or not to be. That is the questionTo be or not to be. ", function other() {console.log("Done speaking");});
	 hamlet.pointAtTarget('CJT12', gravedigger1, function other() {console.log("Done pointing");});
	 hamlet.locomotionPt('CJT12', 311/2,573/2, function other() {console.log("Done moving ha to point")});
	 gravedigger1.pointAtTarget('CJT12', hamlet, function other() {console.log("Done pointing");});
	 gravedigger2.pointAtTarget('CJT12', gravedigger1, function other() {console.log("Done pointing");});
	 gravedigger1.lookAtTarget('CJT12', gravedigger2, function other() {console.log("Done looking");});
	 gravedigger2.locomotionTarget('CJT12', gravedigger1, function other() {console.log("Done moving g2 to g1");gravedigger2.locomotionTarget('CJT12', shovel, function other() {console.log("Done moving g2 to sh");gravedigger1.locomotionTarget('CJT12', gravedigger2, function other(){console.log("Done moving g1 to g2");gravedigger1.lookAtTarget('CJT12', audience,function other(){console.log("Done looking at audience"); gravedigger2.locomotionPt('CJT12', [1689/2, 417/2], [1137/2, 1419/2], function other(){console.log("Done multimovements")})})})})});
	 horatio.locomotionTarget('CJT12', skull1, function other() {console.log("Done moving ho to sk1");horatio.locomotionTarget('CJT12', hamlet, function other() {console.log("Done moving ho to ha"); hamlet.locomotionTarget('CJT12', skull2, function other() {console.log("Done moving hamlet to skull2")})})});
	 });
	 });
	 });
	 }); */

}

exports.startGame = startGame;
exports.endSimulation = endSimulation;
