//var canvas = document.getElementById('forcecanvas');

//define vars for force vector stuff
var server = require('./server');
var bufferW = 50;
var bufferL = 10;
var W = 1060 - (2 * bufferW);
var L = 916 - (2 * bufferL);
var avgdist = 150;
numiterations = 100;
var area = W * L;
var t = numiterations;
var recalc = false;

//and some vars to track the dragged item
var dragIdx = -1;
var dragOffsetX, dragOffsetY;
var movelistener = null;
var uplistener = null;

var characters = null;
var targets = null;
var center = null;
var all = null;
var edges = null;
var humans = new Array();

var startGame = null;

function deleteAll() {
	if (edges != null) {
		//for (var i=edges.length-1; i > 0; i--) {
		while (edges.length > 0) {
			edges[0].dodelete();
		}
		//}
	}
	if (all != null) {
		//for (var i=all.length-1; i > 0; i--) {
		while (all.length > 0) {
			all[0].dodelete();
		}
	}
}

function getLength(veca, vecb) {
	return Math.round(100 * Math.sqrt(Math.pow(veca.x - vecb.x, 2) + Math.pow(veca.y - vecb.y, 2))) / 100;
}

function printAll() {
	console.log("Printing Current State:");
	console.log("=======================");
	if (all != null) {
		for (var a = 0; a < all.length; a++) {
			console.log(all[a].type + ": " + all[a].name + " at (" + all[a].x + "," + all[a].y + ")");
		}
	}
	if (edges != null) {
		for (var b = 0; b < edges.length; b++) {
			//console.log("printing edge "+b);
			//console.log(edges[b]);
			console.log(edges[b].type + " EDGE: " + edges[b].point1.name + "-" + edges[b].point2.name + ", dist=" + getLength(edges[b].point1, edges[b].point2));
		}
	}
	console.log("---------------------------");
	console.log("Done Printing Current State");
}

function recalculate() {// need to incorporate forces by type!!
	recalc = true;
	//cleanupxys();
	if (characters != null && ((characters.length + humans.length) > 1)) {
		console.log("RECALCULATING");
		for (var cj = 0; cj < characters.length; cj++) {
			console.log(characters[cj].name + ":" + characters[cj].pos.x + "," + characters[cj].pos.y);
		}
		printAll();
		console.log("READY");
		for (var i = 1; i < numiterations; i++) {// do 100 iterations?
			// calculate repulsive forces
			if (characters != null) {// initialize
				for (var vchar = 0; vchar < characters.length; vchar++) {
					if (characters[vchar].ismoveable) {//} && characters[vchar].onstage) {
						characters[vchar].upddisp(0, 0);
					}
					//                characters[vchar].disp.x = 0;
					//                characters[vchar].disp.y = 0;
				}
				// calculate repulsive forces
				//console.log("repulsive");
				if (edges != null) {
					//console.log("edges not null");
					for (var e = 0; e < edges.length; e++) {
						//if(i < 2) {console.log("--");}
						var delta = vectdiff(edges[e].point1.pos, edges[e].point2.pos);
						//[vchar].pos, characters[uchar].pos);
						if (delta.x == 0 && delta.y == 0) {
							// do nothing
						} else {
							//if(i < 2) {console.log(delta);}
							var temp1 = {
								x : delta.x / vectsize(delta) * fr(vectsize(delta), edges[e].type, edges[e]),
								y : delta.y / vectsize(delta) * fr(vectsize(delta), edges[e].type, edges[e])
							};
							//if(i < 2) {console.log(temp1);}
							if (edges[e].point2.ismoveable ){//}&& edges[e].point2.onstage) {
								edges[e].point2.upddisp1(vectdiff(edges[e].point2.disp, temp1));
							}
							//if(i < 2) {console.log(edges[e].point2);}
							if (edges[e].point1.ismoveable){// && edges[e].point1.onstage) {
								edges[e].point1.upddisp1(vectsum(edges[e].point1.disp, temp1));
							}
							//if(i < 2) {console.log(edges[e].point1);}
						}
					}
				}
//console.log("attractive");
				// calculate attractive forces
				if (edges != null) {
					//console.log("edges not null");
					for (var e = 0; e < edges.length; e++) {
						//if(i < 2) {console.log("--");}
						var delta = vectdiff(edges[e].point1.pos, edges[e].point2.pos);
						//if(i < 2) {console.log(delta);}
						if (delta.x == 0 && delta.y ==0) {
							// do nothing
						} else {
							var temp2 = {
								x : delta.x / vectsize(delta) * fa(vectsize(delta), edges[e].type, edges[e]),
								y : delta.y / vectsize(delta) * fa(vectsize(delta), edges[e].type, edges[e])
							};
							//if(i < 2) {console.log(temp2);}
							if (edges[e].point2.ismoveable ){//&& edges[e].point2.onstage) {
								edges[e].point2.upddisp1(vectsum(edges[e].point2.disp, temp2));
							}
							//if(i < 2) {console.log(edges[e].point2);}
							if (edges[e].point1.ismoveable ){//&& edges[e].point1.onstage) {
								edges[e].point1.upddisp1(vectdiff(edges[e].point1.disp, temp2));
							}
							//if(i < 2) {console.log(edges[e].point1);}
						}
					}
				}
				// {console.log("====");}
				// limit max displacement to temperature and prevent placement offstage
				for (var v = 0; v < characters.length; v++) {
					var temp3 = {
						x : characters[v].disp.x / vectsize(characters[v].disp),
						y : characters[v].disp.y / vectsize(characters[v].disp)
					};
					//if(i<2) {console.log(temp3);}
					var temp4 = Math.min(vectsize(characters[v].disp), t);
					//if(i<2) {console.log(temp4);}
					var temp5 = vectsum(characters[v].pos, {
						x : temp3.x * temp4,
						y : temp3.y * temp4
					});
					//if(i<2) {console.log(temp5);}
					if (vectsize(temp5) < (avgdist)) {
						// do nothing
					} else {//if (characters[v].onstage) {
						if (temp5.x != NaN && temp5.y != NaN)
						{
							characters[v].updpos(Math.min(W, Math.max(0, temp5.x)), Math.min(L, Math.max(0, temp5.y)));
						}
					//} else {
						// do nothing
					}
				}

				t = numiterations - i;
				for (var cj = 0; cj < characters.length; cj++) {
					//console.log("FORCES POSITION UPDATED!! "+characters[cj].name + ":" + characters[cj].pos.x + "," + characters[cj].pos.y);
				}
			}
		}
		// reset everything to defaults

		t = numiterations;
		for (var a = 0; a < characters.length; a++) {
			characters[a].x = characters[a].pos.x;
			characters[a].y = characters[a].pos.y;
			if (characters[a].ismoveable ){//&& characters[a].onstage) {
				characters[a].upddisp(0, 0);
				// = {
			}
			//      x : 0,
			//     y : 0
			//   };
		}
	
	
	  	console.log("===================AFTER RECALCULATING===========");
		 for (var a = 0; a < all.length; a++) {
		 console.log(all[a].type+": "+all[a].name + " at (" + all[a].x + "," + all[a].y + ")");
		 }
	 }
	 /*for (var b = 0; b < edges.length; b++) {
	 console.log(edges[b].type+" EDGE: "+edges[b].point1.name + "-" + edges[b].point2.name + ", dist=" + getLength(edges[b].point1, edges[b].point2));
	 }*/
	recalc = false;
	reversexys();
}

function cleanupxys() {
	// when done calculating, reset the x & y values to work for the main function
	for (var i=0; i< all.length;i++) {
		all[i].x = -1 * (all[i].x -2312) / 2;
		all[i].y = (all[i].y - 209) / 2;
	}
}
function reversexys() {
	if (all != null) {
	for (var i=0; i < all.length;i++) {
		all[i].x = (-2 * all[i].x) + 2312;
		all[i].y = (2 * all[i].y) + 209;
	}
	}
}

function vectdiff(A, B) {// A-B, returns {x,y}
	return {
		x : A.x - B.x,
		y : A.y - B.y
	};

}

function vectsize(A) {// size of A returns float
	//console.log("vectsize :"+(Math.sqrt((A.x * A.x) + (A.y * A.y))));
	return Math.sqrt((A.x * A.x) + (A.y * A.y));
}

function vectsum(A, B) {// A+B, returns {x,y}
	return {
		x : A.x + B.x,
		y : A.y + B.y
	};
}

function fa(x, mytype, e) {
	switch(mytype) {
		case 'audience':
			if (e.point2.name == 'CENTERA') {
				return (x * x) - ((L / 4) * (L / 4));
			} else {
				return (x * x) - ((L / 2) * (L / 2));
			}
			break;
		case 'center':
		// return (x*x) - (((characters.length )*2*avgdist/Math.PI)*((characters.length )*2*avgdist/Math.PI));
		// break;
		case 'char':
			// if paired, use avgdist*timeleft
			// if relstatus = like avgdist*2/3, = neutral avgdist, = hate avgdist*4/3
			// should I do something based on how strong
			return (x * x) - (avgdist * avgdist);
			break;
		case 'target':
			// attract timeleft*distance -- gives closer & stronger since no c param & larger a param
			return (x * x) * 6;
		case 'human':
			// weaker attraction
			return (x * x * .5) - (avgdist * avgdist);
		default:
			return (x * x) - (avgdist * avgdist);
			break;
	}
	//return (x * x) - (avgdist * avgdist);

}

function fr(x, mytype, e) {
	//console.log("In fr x:"+x+","+mytype);
	switch(mytype) {
		case 'audience':
			if (e.point2.name == 'CENTERA') {
				//console.log("no force");
				return 0;
				// no repelling if audience link
			} else {
				return (-1 * x * x) + ((L / 2) * (L / 2));
			}
			break;
		case 'center':
		// return (-1*x*x) + (((characters.length )*2*avgdist/Math.PI)*((characters.length )*2*avgdist/Math.PI));
		//break;
		case 'char':
			// if paired, use avgdist*timeleft
			// if relstatus = like avgdist*2/3, = neutral avgdist, = hate avgdist*4/3
			// should I do something based on how strong
			return (-1 * x * x) + (avgdist * avgdist);
			break;
		case 'target':
			// no repellent force
			return 0;
		case 'human':
			//weaker repelling
			return 0;
		// (x*x*-.05) + (avgdist*avgdist);
		default:
			return (-1 * x * x) + (avgdist * avgdist);
			break;
	}
	//return -1 * (x * x) + (avgdist * avgdist);
	//return k*k/x;
}

//---------------------------------------------------------------

function FCharacter(name, x, y, rank, onstage, links) {
	this.calledby = name;
	this.name = name;
	this.type = 'char';
	this.x = x;
	this.y = y;
	this.rank = rank;
	this.onstage = onstage;
	this.links = new Array();
	this.lastangle = -99;
	this.ismoveable = true;
	// stands for unset
	//console.log("Created FCharacter="+this.name);
	
	// for force vector calculations
	this.disp = {
		x : 0,
		y : 0
	};
	//vector of 0 by default;
	this.pos = {
		x : x,
		y : y
	};
	//current position;

	if (characters == null) {
		characters = new Array();
		characters[0] = this;
	} else {
		characters[characters.length] = this;

	}
	if (all == null) {
		all = new Array();
		all[0] = this;
	} else {
		all[all.length] = this;
	}

	// gsglob.addEntity(
	new Audience(this.name + "A", this.x, L + bufferL + 5);
	//	);
	// gsglob.addEntity(
	new Link('audience', this.name, this.name + "A", 40, 20);
	//	);
	for (var i = 0; i < all.length; i++) {
		if (all[i].name == this.name + "A") {
			this.aud = all[i];
		}
		if ((all[i] instanceof FCharacter || all[i] instanceof Human) && all[i].name != this.name) {
			new Link('character', this.name, all[i].name, 40, 20);
		}
	}
	if (center == null && ((characters.length + humans.length) >= 2)) {
		//gsglob.addEntity(new Center());
		new Center();
	} else if (center == null) {
		// do nothing
	} else {
		// gsglob.addEntity(
		new Link('center', this.name, "CENTER", 40, 20);
		//);
		recalcCenter();
	}

	this.updpos = function(x, y) {
		//console.log(this.name + " x="+x+", y="+y);
		this.pos.x = x;
		this.pos.y = y;
		this.aud.x = x;
		this.aud.pos.x = x;
		recalcCenter();

	}

	this.upddisp = function(x, y) {
		this.disp.x = x;
		this.disp.y = y;
		this.aud.disp.x = x;
	}

	this.upddisp1 = function(vec) {
		this.disp.x = vec.x;
		this.disp.y = vec.y;
		this.aud.disp.x = vec.x;
	}

	this.dodelete = function() {
		//remove all links
		// remove from characters array
		//var which = findFItem('C', this.name);
		//console.log("deleting char " + this.name);
		var index = characters.indexOf(this);
		characters.splice(index, 1);

		// remove from all array
		index = all.indexOf(this);
		all.splice(index, 1);

		// remove center if count is less than 2
		if (((characters.length + humans.length) == 1) && center != null) {
			center.dodelete();
		}

		// remove from draw
		//gsglob.delEntity(this);
		//delete this; // might not work to destroy this instance?
	}
}

function Unmoveables(name, x, y, links) {
	this.name = name;
	this.type = 'target';
	this.x = x;
	this.y = y;
	this.links = new Array();
	this.ismoveable = false;
	//console.log("Created Unmoveable="+this.name);
	this.disp = {
		x : 0,
		y : 0
	};
	//vector of 0 by default;
	this.pos = {
		x : x,
		y : y
	};
	//current position;

	if (all == null) {
		all = new Array();
		all[0] = this;
	} else {
		all[all.length] = this;
	}

	this.doupdate = function(x, y) {
		this.x = x;
		this.y = y;

	}

	this.dodelete = function() {
		//remove all links
		// remove from characters array
		//var which = findFItem('C', this.name);
		//console.log("deleting unmoveable " + this.name);

		// remove from all array
		var index = all.indexOf(this);
		all.splice(index, 1);

		// remove center if count is less than 2
		// remove from draw
		//gsglob.delEntity(this);
		//delete this; // might not work to destroy this instance?
	}
}

function Human(calledby, x, y, rank, onstage, links) {
	this.calledby = calledby;
	this.name = "HUMAN";
	this.type = 'human';
	this.x = x;
	this.y = y;

	this.orig = {
		x : this.x,
		y : this.y
	};

	// this.orig.y = y;
	this.ismoveable = false;
	//console.log("Created HUMAN");
	this.disp = {
		x : 0,
		y : 0
	};
	//vector of 0 by default;
	this.pos = {
		x : x,
		y : y
	};
	//current position;
	this.rank = rank;
	this.onstage = onstage;
	if (humans == null) {
		humans = new Array();
		humans[0] = this;
	} else {
		humans[humans.length] = this;
	}
	if (all == null) {
		all = new Array();
		all[0] = this;
	} else {
		all[all.length] = this;
	}
	this.links = new Array();

	// gsglob.addEntity(
	new Audience(this.name + "A", this.x, L + bufferL + 5);
	//);
	// gsglob.addEntity(
	new Link('audience', this.name, this.name + "A", 40, 20);
	//);

	for (var i = 0; i < all.length; i++) {
		if (all[i].name == this.name + "A") {
			this.aud = all[i];
		}
		if ((all[i] instanceof FCharacter || all[i] instanceof Human) && all[i].name != this.name) {
			new Link('character', this.name, all[i].name, 40, 20);
		}
	}

	if (center == null && characters != null && ((characters.length + humans.length) == 2)) {
		//gsglob.addEntity(new Center());
		new Center();
	} else if (center == null) {
		// do nothing
	} else {
		//gsglob.addEntity(
		new Link('center', this.name, "CENTER", 40, 20);
		//);
	}

	this.doupdate = function(x, y) {
		this.x = x;
		this.y = y;

	}

	this.dodelete = function() {
		//remove all links
		// remove from characters array
		//var which = findFItem('C', this.name);
		//console.log("deleting human " + this.name);
		var index = humans.indexOf(this);
		humans.splice(index, 1);

		// remove from all array
		index = all.indexOf(this);
		all.splice(index, 1);

		// remove center if count is less than 2
		// remove from draw
		//gsglob.delEntity(this);
		//delete this; // might not work to destroy this instance?
	}
}

function recalcCenter() {
	if (center != null) {
		var summedx = 0;
		var summedy = 0;
		for (var i = 0; i < characters.length; i++) {
			summedx = summedx + characters[i].x;
			summedy = summedy + characters[i].y;
		}
		if (humans.length > 0) {
			summedx = summedx + humans[0].x;
			summedy = summedy + humans[0].y;
		}
		center.updpos(summedx / (characters.length + humans.length), summedy / (characters.length+humans.length));
		//console.log("Updated CENTER");
	}
}

function Center() {
	this.name = "CENTER";
	this.type = 'CENTER';
	// find center of existing onstage characters
	var summedx = 0;
		var summedy = 0;
		for (var i = 0; i < characters.length; i++) {
			summedx = summedx + characters[i].x;
			summedy = summedy + characters[i].y;
		}
		if (humans.length > 0) {
			summedx = summedx + humans[0].x;
			summedy = summedy + humans[0].y;
		}
	//var temp1 = (characters[0].x - characters[1].x) / 2;
	//var temp2 = (characters[0].y - characters[1].y) / 2;
	this.x = summedx / (characters.length + humans.length);//characters[0].x - temp1;
	this.y = summedy / (characters.length + humans.length);//characters[0].y - temp2;
	this.ismoveable = true;
	//console.log("Created CENTER");
	this.disp = {
		x : 0,
		y : 0
	};
	center = this;
	//vector of 0 by default;
	this.pos = {
		x : this.x,
		y : this.y
	};
	//current position;
	this.links = new Array();
	if (all == null) {
		all = new Array();
		all[0] = this;
	} else {
		all[all.length] = this;
	}
	if (characters == null) {
		characters = new Array();
		characters[0] = this;
	} else {
		characters[characters.length] = this;
	}

	for (var c = 0; c < characters.length; c++) {
		if (characters[c].name == this.name) {
			// do nothing
		} else {
			//gsglob.addEntity(
			new Link('center', this.name, characters[c].name, 40, 20);
			//);
		}
	}
	for (var h = 0; h < humans.length; h++) {
		if (humans[h].name == this.name) {
			// do nothing
		} else {
			new Link('center', this.name, humans[h].name, 40, 20);
		}
	}
	// gsglob.addEntity(
	new Audience(this.name + "A", this.x, L + bufferL + 5);
	//);
	// gsglob.addEntity(
	new Link('audience', this.name, this.name + "A", 40, 20);
	//);

	for (var i = 0; i < all.length; i++) {
		if (all[i].name == this.name + "A") {
			this.aud = all[i];
		}
	}

	this.updpos = function(x, y) {
		//console.log(this.name + " x="+x+", y="+y);
		this.pos.x = x;
		this.pos.y = y;
		this.x = x;
		this.y = y;
		this.aud.x = x;
		this.aud.pos.x = x;
	}

	this.upddisp = function(x, y) {
		this.disp.x = x;
		this.disp.y = y;
		this.aud.disp.x = x;
	}

	this.upddisp1 = function(vec) {
		this.disp.x = vec.x;
		this.disp.y = vec.y;
		this.aud.disp.x = vec.x;
	}

	this.dodelete = function() {
		//remove all links
		// remove from characters array
		//var which = findFItem('C', this.name);
		//console.log("deleting center " + this.name);
		var index = characters.indexOf(this);
		characters.splice(index, 1);

		// remove from all array
		index = all.indexOf(this);
		all.splice(index, 1);
		center = null;

		// remove center if count is less than 2
		// remove from draw
		//gsglob.delEntity(this);
		//delete this; // might not work to destroy this instance?
	}
}

function Audience(name, x, y) {
	this.name = name;
	this.type = 'AUDIENCE';
	this.x = x;
	this.y = y;
	this.ismoveable = false;
	//console.log("Created Audience="+this.name);
	this.disp = {
		x : 0,
		y : 0
	};
	//vector of 0 by default;
	this.pos = {
		x : x,
		y : y
	};
	//current position;
	this.links = new Array();
	if (all == null) {
		all = new Array();
		all[0] = this;
	} else {
		all[all.length] = this;
	}

	this.dodelete = function() {
		//remove all links
		// remove from characters array
		//var which = findFItem('C', this.name);
		//console.log("deleting audience " + this.name);

		// remove from all array
		var index = all.indexOf(this);
		all.splice(index, 1);

		// remove center if count is less than 2
		// remove from draw
		//gsglob.delEntity(this);
		//delete this; // might not work to destroy this instance?
	}
}

function Link(type, point1, point2, attraction, repel) {
	console.log("Called new Link with this info:"+point1+","+point2);
	//console.log(point1);
	//console.log(point2);
	//printAll();
	//console.log("pre=link done");
	this.type = type;
	var which1 = null;
	var which2 = null;
	if (characters != null || humans != null) {
		//console.log("Writing All objects in forces:");
		for (var i = 0; i < all.length; i++) {
			//console.log(all[i].name);
			if (all[i].name == point1) {
				which1 = all[i];
				all[i].links[all[i].links.length] = this;
				// add to the character's list
			}
			if (all[i].name == point2) {
				which2 = all[i];
				all[i].links[all[i].links.length] = this;
				// add to the character's list
			}
		}
		//console.log("Done writing all objects in forces");
	}
	if (which1 == null || which2 == null) {
		//console.log("point1=" + point1 + ",point2=" + point2 + ",which1=" + which1 + "which2=" + which2);
	}
	this.point1 = which1;
	//point1;
	this.point2 = which2;
	//point2;
	this.attraction = attraction;
	this.repel = repel;
	this.created = new Date().getTime();
	if (edges == null) {
		edges = new Array();
		edges[0] = this;
	} else {
		edges[edges.length] = this;
	}
	//console.log("created " + this.type + " link:" + this.point1 + ", " + this.point2);

	this.doupdate = function(attract, repel) {
		this.attraction = attract;
		this.repel = repel;

	}
	//createForceUpdMsg("LINK", this, "CREATE");

	this.dodelete = function() {
		//remove all links
		// remove from characters array
		//var which = findFItem('C', this.name);
		//console.log("deleting link " + this.type + "," + this.point1 + "," + this.point2);
		var index = edges.indexOf(this);
		edges.splice(index, 1);

		// remove from all array
		//index = all.indexOf(this);
		//all.splice(index,1);
		// remove center if count is less than 2
		// remove from draw
		//gsglob.delEntity(this);
		//delete this; // might not work to destroy this instance?
	}
}

//---------------------------------------------------------------

fstartGame = function() {
	//function startGame(gs) {
	//   gsglob = gs;
	//start with only the mousedown event attached
	//   canvas = document.getElementById('forcecanvas');
	//    canvas.addEventListener("mousedown", mousedown);

	//define vars for force vector stuff
	// W = 1060;
	// L = 916;
	area = W * L;
	t = W / 10;
	recalc = false;

	//and some vars to track the dragged item
	dragIdx = -1;
	dragOffsetX, dragOffsetY;
	movelistener = null;
	uplistener = null;

	characters = null;
	targets = null;
	all = null;
	edges = null;
	humans = null;

	bufferW = 50;
	bufferL = 10;
	W = 1060 - (2 * bufferW);
	L = 916 - (2 * bufferL);
	avgdist = 150;
	numiterations = 100;

	t = numiterations;



}

function returnall() {
	return all;
}

exports.FCharacter = FCharacter;
exports.Unmoveables = Unmoveables;
exports.Human = Human;
exports.Link = Link;
exports.fstartGame = fstartGame;
exports.recalculate = recalculate;
exports.all = returnall;
exports.printAll = printAll;
exports.deleteAll = deleteAll; 