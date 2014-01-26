//var canvas = document.getElementById('forcecanvas');

//define vars for force vector stuff
var server = require('./server');
var bufferW = 50;
var bufferL = 10;
var W = 1060-(2*bufferW);
var L = 916-(2*bufferL);
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
var humans = null;
var gsglob = null;
var startGame = null;

function sethuman() {
    //console.log("x,y=" + document.getElementById("humanx").value + "," + document.getElementById("humany").value);
    humans[0].x = document.getElementById("humanx").value;
    humans[0].y = document.getElementById("humany").value;
    recalculate();
}


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
		while(all.length > 0) {
		all[0].dodelete();
	}
	}
}

    function createForceUpdMsg(type, obj, action) {
    	var msg = "FORCES\t"+action+"\t"+type;
    	var start = msg;
		switch (type) {
			case "CHAR":
			case "HUMAN":
				msg = msg + "\t" + obj.name + "\t" + obj.x + "\t" + obj.y + "\t" + obj.rank;
				break;
			case "TARGET":
				msg = msg + "\t" + obj.name + "\t" + obj.x + "\t" + obj.y;
				break;
			case "LINK":
				msg = msg + "\t" + obj.type + "\t" + obj.point1.name + "\t" + obj.point2.name + "\t" + obj.attraction + "\t" + obj.repel;
				break;
			case "AUDIENCE":
				msg = msg + "\t" + obj.name + "\t" + obj.x + "\t" + obj.y ;
				break;
			case "CENTER":
				msg = msg + "\t" + obj.x + "\t" + obj.y;
				break;
			default:
				msg = msg + "\t ERROR!";
				console.log("ERROR Creating upd msg");
				break;
		}
		if(msg != start) {
			server.sendMsg(msg);
		}
    }
    
    
function getLength(veca, vecb) {
    return Math.round(100 * Math.sqrt(Math.pow(veca.x - vecb.x, 2) + Math.pow(veca.y - vecb.y, 2))) / 100;
}

function handleFileSelect(evt) {
    //var files = evt.target.files; // FileList object
    var files = document.getElementById("files").value;
    //console.log("Loaded this file=" + files);
    // Loop through the FileList and render image files as thumbnails.
    //for (var i = 0, f; f = files[i]; i++) {

    // Only process image files.
    // if (!f.type.match('image.*')) {
    //   continue;
    //}

    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onloadend = (function(theFile) {
        return function(e) {
            // Render thumbnail.

           // console.log(e.target.result);
            //do what I need to do to load the file
            loadfile(e.target.result);
        };
    })(files[0]);

    // Read in the image file as a data URL.
    reader.readAsBinaryString(files[0]);
    //}
}

var globlogfile = null;
function onInitFs(fs) {

    fs.root.getFile('log.txt', {
        create : true,
        exclusive : true
    }, function(fileEntry) {

        // Create a FileWriter object for our FileEntry (log.txt).
        fileEntry.createWriter(function(fileWriter) {
            globlogfile = fileWriter;
            fileWriter.seek(fileWriter.length);
            // Start write position at EOF.

            // Create a new Blob and write it to log.txt.
            var blob = new Blob(['Hello World'], {
                type : 'text/plain'
            });

            fileWriter.write(blob);

        }, errorHandler);

    }, errorHandler);

}

function errorHandler(e) {
    //console.log("Error:" + e.toString());
}


//window.webkitRequestFileSystem(window.PERSISTENT, 1024*1024, onInitFs, errorHandler);
function randomizefile() {
    //create a random file with a dataset
    var numchars = Math.ceil(Math.random()*12); 
    for (var e=0; e < edges.length; e++) {
       // gsglob.delEntity(edges[e]);
    }
    for(var a = 0; a < all.length; a++) {
        //gsglob.delEntity(all[a]);
        
    }
    
    characters = null;
    targets = null;
    center = null;
    all = null;
    edges = null;
    humans = null;
    for (var i = 0; i < numchars; i++) {
        // create the character with the sequential name
        //gsglob.addEntity(
        	new FCharacter(String.fromCharCode(i+65), Math.random()*W + bufferW, Math.random()*L + bufferL, 1, true, null);//);
        if (i==0) {
            // do nothing
        } else{
            for (var k = 0; k < i; k++) {
                // create edge between the two characters with random pairing & liking
                //gsglob.addEntity(
                	new Link('char', String.fromCharCode(i+65), String.fromCharCode(k+65), Math.ceil(Math.random()*3), Math.ceil(Math.random()*3));//);
            }
        }
    }
    var numtargets = Math.ceil(Math.random()*numchars); // don't have any more than the number of characters
    var which = new Array(numchars);
    for (var j=0; j<which.length;j++) {
        which[j] = false;
    }
    for (var t=0; t< numtargets; t++) {
        // create the target and pick a random char to tie it to
        var tieto = Math.floor(Math.random()*numchars);
        while (which[tieto]) {
            tieto = Math.floor(Math.random()*numchars);
        }
        which[tieto] = true;
        // create target & edge
       // gsglob.addEntity(
        	new Unmoveables(String.fromCharCode(tieto+65)+"T", Math.random()*W + bufferW, Math.random()*L + bufferL, null);//);
        //gsglob.addEntity(
        	new Link('target', String.fromCharCode(tieto+65), String.fromCharCode(tieto+65)+"T", Math.ceil(Math.random()*3), Math.ceil(Math.random()*3));//);
    }
    // create a human
   // gsglob.addEntity(
    	new Human(Math.random()*W + bufferW, Math.random()*L + bufferL, 1, true, null);//);
    for (var c=0; c < numchars;c++) {
        //gsglob.addEntity(
        	new Link('human', String.fromCharCode(c+65), "HUMAN", Math.ceil(Math.random()*3), Math.ceil(Math.random()*3));//);
    }
    
    // print current locations
    console.log("===================NEW SETUP===========");
    for (var a = 0; a < all.length; a++) {
        console.log(all[a].type +": "+all[a].name + " at (" + all[a].x + "," + all[a].y + ")");
    }
    for (var b = 0; b < edges.length; b++) {
        console.log(edges[b].type+" EDGE: "+edges[b].point1.name + "-" + edges[b].point2.name + ", dist=" + getLength(edges[b].point1, edges[b].point2));
    }
    
   // recalculate(); // run the adjustments
    
    // print new locations
    
 //   globlogfile.seek(globlogfile.length);
 //   var blob = new Blob(['just a test'], {
 //       type : 'text/plain'
 //   });
 //   globlogfile.write(blob);
}

function printAll() {
	console.log("Printing Current State:");
	console.log("=======================");
	if (all != null) {
	for (var a = 0; a < all.length; a++) {
        console.log(all[a].type +": "+all[a].name + " at (" + all[a].x + "," + all[a].y + ")");
    }
   }
   if (edges != null) {
    for (var b = 0; b < edges.length; b++) {
        console.log(edges[b].type+" EDGE: "+edges[b].point1.name + "-" + edges[b].point2.name + ", dist=" + getLength(edges[b].point1, edges[b].point2));
    }
   }
    console.log("---------------------------");
    console.log("Done Printing Current State");
}

function loadfile(text) {
    // parse text and setup objects
    perline = text.split('\n');
    //console.log("First line=" + perline[0]);
    for (var i = 0; i < perline.length; i++) {
        perfield = perline[i].split(' ');
        switch(perfield[0]) {
            case 'chars':
                //console.log("CHARS " + perfield[1] + ", (" + perfield[2] + "," + perfield[3] + ")");
                // need to add target and target time duration to this process
                gs.addEntity(new FCharacter(perfield[1], perfield[2], perfield[3], perfield[6], (perfield[7] == "true" ? true : false), null));
                break;
            case 'props':
                //console.log("PROPS");
                break;
            case 'rels':
                //console.log("RELS");
                break;
            default:
                //console.log(perfield[0]);
                break;
        }
    }
}

function recalculate() {// need to incorporate forces by type!!
    recalc = true;
    if (characters!= null && characters.length > 1) {
    console.log("RECALCULATING");
    for(var cj=0;cj<characters.length;cj++) {
            	console.log(characters[cj].name+":"+characters[cj].pos.x+","+characters[cj].pos.y);
            }
            console.log("READY");
    for (var i = 1; i < numiterations; i++) {// do 100 iterations?
        // calculate repulsive forces
        if (characters != null) {// initialize
            for (var vchar = 0; vchar < characters.length; vchar++) {
                if (characters[vchar].ismoveable && characters[vchar].onstage) {
                    characters[vchar].upddisp(0, 0);
                }
                //                characters[vchar].disp.x = 0;
                //                characters[vchar].disp.y = 0;
            }
            // calculate repulsive forces
            if (edges != null) {
                for (var e = 0; e < edges.length; e++) {
                    var delta = vectdiff(edges[e].point1.pos, edges[e].point2.pos);
                    //[vchar].pos, characters[uchar].pos);
                    var temp1 = {
                        x : delta.x / vectsize(delta) * fr(vectsize(delta), edges[e].type, edges[e]),
                        y : delta.y / vectsize(delta) * fr(vectsize(delta), edges[e].type, edges[e])
                    };
                    if (edges[e].point2.ismoveable && edges[e].point2.onstage) {
                        edges[e].point2.upddisp1(vectdiff(edges[e].point2.disp, temp1));
                    }
                    if (edges[e].point1.ismoveable && edges[e].point1.onstage) {
                        edges[e].point1.upddisp1(vectsum(edges[e].point1.disp, temp1));
                    }
                }
            }

            // calculate attractive forces
            if (edges != null) {
                for (var e = 0; e < edges.length; e++) {
                    var delta = vectdiff(edges[e].point1.pos, edges[e].point2.pos);

                    var temp2 = {
                        x : delta.x / vectsize(delta) * fa(vectsize(delta), edges[e].type, edges[e]),
                        y : delta.y / vectsize(delta) * fa(vectsize(delta), edges[e].type, edges[e])
                    };
                    if (edges[e].point2.ismoveable && edges[e].point2.onstage) {
                        edges[e].point2.upddisp1(vectsum(edges[e].point2.disp, temp2));
                    }
                    if (edges[e].point1.ismoveable && edges[e].point1.onstage) {
                        edges[e].point1.upddisp1(vectdiff(edges[e].point1.disp, temp2));
                    }
                }
            }
            // limit max displacement to temperature and prevent placement offstage
            for (var v = 0; v < characters.length; v++) {
                var temp3 = {
                    x : characters[v].disp.x / vectsize(characters[v].disp),
                    y : characters[v].disp.y / vectsize(characters[v].disp)
                };
                var temp4 = Math.min(vectsize(characters[v].disp), t);
                var temp5 = vectsum(characters[v].pos, {
                    x : temp3.x * temp4,
                    y : temp3.y * temp4
                });
                if (vectsize(temp5) < (avgdist)) {
                    // do nothing
                } else if (characters[v].onstage) {
                    characters[v].updpos(Math.min(W, Math.max(0, temp5.x)), Math.min(L, Math.max(0, temp5.y)));
                } else {
                	// do nothing
                }
            }

            t = numiterations - i;
            for(var cj=0;cj<characters.length;cj++) {
            	console.log(characters[cj].name+":"+characters[cj].pos.x+","+characters[cj].pos.y);
            }
        }
    }
    // reset everything to defaults
     
    t = numiterations;
    for (var a = 0; a < characters.length; a++) {
    	characters[a].x = characters[a].pos.x;
    	characters[a].y = characters[a].pos.y;
        if (characters[a].ismoveable && characters[a].onstage) {
            characters[a].upddisp(0, 0);
            // = {
        }
        //      x : 0,
        //     y : 0
        //   };
    }
    }
    recalc = false;
  /*  console.log("===================AFTER RECALCULATING===========");
    for (var a = 0; a < all.length; a++) {
        console.log(all[a].type+": "+all[a].name + " at (" + all[a].x + "," + all[a].y + ")");
    }
    for (var b = 0; b < edges.length; b++) {
        console.log(edges[b].type+" EDGE: "+edges[b].point1.name + "-" + edges[b].point2.name + ", dist=" + getLength(edges[b].point1, edges[b].point2));
    }*/
}

function vectdiff(A, B) {// A-B, returns {x,y}
    return {
        x : A.x - B.x,
        y : A.y - B.y
    };

}

function vectsize(A) {// size of A returns float
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
            if(e.point2.name == 'CENTERA') {
                return (x*x) - ((L/4)*(L/4));
            } else {
                return (x*x) - ((L/2)*(L/2));
            }
            break;
        case 'center':
           // return (x*x) - (((characters.length )*2*avgdist/Math.PI)*((characters.length )*2*avgdist/Math.PI));
           // break;
        case 'char':
            // if paired, use avgdist*timeleft
            // if relstatus = like avgdist*2/3, = neutral avgdist, = hate avgdist*4/3
            // should I do something based on how strong
            return (x*x) - (avgdist*avgdist);
            break;
        case 'target':
            // attract timeleft*distance -- gives closer & stronger since no c param & larger a param
            return (x*x)*6;
        case 'human':
            // weaker attraction
            return (x*x*.5) - (avgdist*avgdist);
        default:
            return (x * x) - (avgdist * avgdist);
            break;
    }
    //return (x * x) - (avgdist * avgdist);

}

function fr(x, mytype, e) {
    switch(mytype) {
        case 'audience':
            if (e.point2.name == 'CENTERA') {
                //console.log("no force");
                return 0; // no repelling if audience link
            } else {
                return (-1*x*x) + ((L/2)*(L/2));
            }
            break;
        case 'center':
           // return (-1*x*x) + (((characters.length )*2*avgdist/Math.PI)*((characters.length )*2*avgdist/Math.PI));
            //break;
        case 'char':
            // if paired, use avgdist*timeleft
            // if relstatus = like avgdist*2/3, = neutral avgdist, = hate avgdist*4/3
            // should I do something based on how strong
            return (-1*x*x) + (avgdist*avgdist);
            break;
        case 'target':
            // no repellent force
            return 0;
        case 'human':
            //weaker repelling
            return 0;// (x*x*-.05) + (avgdist*avgdist);
        default:
            return (-1*x * x) + (avgdist * avgdist);
            break;
    }
    //return -1 * (x * x) + (avgdist * avgdist);
    //return k*k/x;
}

//---------------------------------------------------------------

 function FCharacter(name, x, y, rank, onstage, links) {
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
createForceUpdMsg("CHAR", this, "CREATE");
       // gsglob.addEntity(
        	new Audience(this.name + "A", this.x, L+bufferL+5);
        //	);
       // gsglob.addEntity(
        	new Link('audience', this.name, this.name + "A", 40, 20);
        //	);
        for (var i = 0; i < all.length; i++) {
            if (all[i].name == this.name + "A") {
                this.aud = all[i];
            }
            if (all[i] instanceof FCharacter && all[i].name != this.name) {
            	new Link('character', this.name, all[i].name, 40,20);
            }
        }
        if (center == null && characters.length >= 2) {
                //gsglob.addEntity(new Center());
                new Center();
        } else if (center == null) {
            // do nothing
        } else {
           // gsglob.addEntity(
            	new Link('center', this.name, "CENTER", 40, 20);//);
            	recalcCenter();
        }
        
        
        
        this.updpos = function(x, y) {
            //console.log(this.name + " x="+x+", y="+y);
            this.pos.x = x;
            this.pos.y = y;
            this.aud.x = x;
            this.aud.pos.x = x;
            recalcCenter();
            createForceUpdMsg("CHAR", this, "UPDATE");
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
        	console.log("deleting char "+this.name);
        	var index = characters.indexOf(this);
        	characters.splice(index,1);
        	
        	// remove from all array
        	index = all.indexOf(this);
        	all.splice(index,1);
        	
        	// remove center if count is less than 2
        	if (characters.length = 1 && center != null) {
        		center.dodelete();
        	}
        	createForceUpdMsg("CHAR", this, "DELETE");
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
        
        this.doupdate = function(x,y) {
        	this.x = x;
        	this.y = y;
        	createForceUpdMsg("TARGET", this, "UPDATE");
        }
        
        createForceUpdMsg("TARGET", this, "CREATE");
        
        this.dodelete = function() {
        	//remove all links
        	// remove from characters array
        	//var which = findFItem('C', this.name);
        	console.log("deleting unmoveable "+this.name);
        	
        	// remove from all array
        	var index = all.indexOf(this);
        	all.splice(index,1);
        	createForceUpdMsg("TARGET", this, "DELETE");
        	// remove center if count is less than 2
        	// remove from draw
        	//gsglob.delEntity(this);
			//delete this; // might not work to destroy this instance?
        }

    }

    function Human(x, y, rank, onstage, links) {
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
       	new Audience(this.name + "A", this.x, L+bufferL+5);//);
       // gsglob.addEntity(
       	new Link('audience', this.name, this.name + "A", 40, 20);//);
        
        if (center == null && characters.length == 2) {
                //gsglob.addEntity(new Center());
                new Center();
        } else if (center == null) {
            // do nothing
        } else {
            //gsglob.addEntity(
            	new Link('center', this.name, "CENTER", 40, 20);//);
        }
        
        this.doupdate = function(x,y) {
        	this.x = x;
        	this.y = y;
        	createForceUpdMsg("HUMAN", this, "UPDATE");
        }
        
        createForceUpdMsg("HUMAN", this, "CREATE");
        
        this.dodelete = function() {
        	//remove all links
        	// remove from characters array
        	//var which = findFItem('C', this.name);
        	console.log("deleting human "+this.name);
        	var index = humans.indexOf(this);
        	humans.splice(index,1);
        	
        	// remove from all array
        	index = all.indexOf(this);
        	all.splice(index,1);
        	createForceUpdMsg("HUMAN", this, "DELETE");
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
	for (var i=0; i < characters.length; i++) {
		summedx = summedx + characters[i].x;
		summedy = summedy + characters[i].y;
	}
	center.updpos(summedx/characters.length, summedy/characters.length);
	}
}

 function Center() {
        this.name = "CENTER";
        this.type = 'CENTER';
        // find center of existing onstage characters
        var temp1 = (characters[0].x - characters[1].x)/2;
        var temp2 = (characters[0].y - characters[1].y)/2;
        this.x = characters[0].x - temp1;
        this.y = characters[0].y - temp2;
        this.ismoveable = true;
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
                createForceUpdMsg("CENTER", this, "CREATE");
        for(var c=0; c < characters.length; c++) {
            if (characters[c].name == this.name) {
                // do nothing
            } else {
                 //gsglob.addEntity(
                 	new Link('center', this.name, characters[c].name, 40, 20);//);
             }
        }
       // gsglob.addEntity(
        	new Audience (this.name+"A", this.x, L+bufferL+5);//);
       // gsglob.addEntity(
        	new Link('audience', this.name, this.name+"A", 40,20);//);
        
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
        	console.log("deleting center "+this.name);
        	var index = characters.indexOf(this);
        	characters.splice(index,1);
        	
        	// remove from all array
        	index = all.indexOf(this);
        	all.splice(index,1);
        	center = null;
        	createForceUpdMsg("CENTER", this, "DELETE");
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
        
        createForceUpdMsg("AUDIENCE", this, "CREATE");
        
        this.dodelete = function() {
        	//remove all links
        	// remove from characters array
        	//var which = findFItem('C', this.name);
        	console.log("deleting audience "+this.name);
        	
        	// remove from all array
        	var index = all.indexOf(this);
        	all.splice(index,1);
        	createForceUpdMsg("AUDIENCE", this, "DELETE");
        	// remove center if count is less than 2
        	// remove from draw
        	//gsglob.delEntity(this);
			//delete this; // might not work to destroy this instance?
        }

    }

    function Link(type, point1, point2, attraction, repel) {
        this.type = type;
        var which1 = null;
        var which2 = null;
        if (characters != null) {
            for (var i = 0; i < all.length; i++) {
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
        }
        if (which1 == null || which2 == null) {
            console.log("point1=" + point1 + ",point2=" + point2 + ",which1=" + which1 + "which2=" + which2);
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
        console.log("created "+this.type+" link:"+this.point1.name+", "+this.point2.name);
        createForceUpdMsg("LINK", this, "CREATE");
        
        this.doupdate = function (attract, repel) {
        	this.attraction = attract;
        	this.repel = repel;
        	createForceUpdMsg("LINK", this, "UPDATE");
        }
        //createForceUpdMsg("LINK", this, "CREATE");
        
        this.dodelete = function() {
        	//remove all links
        	// remove from characters array
        	//var which = findFItem('C', this.name);
        	console.log("deleting link "+this.type+","+this.point1.name+","+this.point2.name);
        	var index = edges.indexOf(this);
        	edges.splice(index,1);
        	createForceUpdMsg("LINK", this, "DELETE");
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



fstartGame = function(gs) {
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
W = 1060-(2*bufferW);
L = 916-(2*bufferL);
avgdist = 150;
numiterations = 100;

t = numiterations;


gsglob = gs;

   

    function Stage() {
        
      
    }
/*
    gs.addEntity(new Stage());
    gs.addEntity( c1 = new Character('A', 30, 50, 1, true, null));
    gs.addEntity( c2 = new Character('B', 100, 50, 2, true, null));
    gs.addEntity( c3 = new Character('C', 200, 150, 5, true, null));
    gs.addEntity( c4 = new Character('D', 30, 150, 4, true, null));
    gs.addEntity( u1 = new Unmoveables('E', 200, 400, null));
    gs.addEntity( h1 = new Human(400, 200, 3, true, null));
    gs.addEntity(new Link('char', 'A', 'C', 20, 5));
    gs.addEntity(new Link('char', 'A', 'B', 20, 5));
    gs.addEntity(new Link('char', 'B', 'D', 20, 5));
    gs.addEntity(new Link('char', 'B', 'C', 20, 5));
    gs.addEntity(new Link('char', 'A', 'D', 20, 5));
    gs.addEntity(new Link('human', 'A', 'HUMAN', 20, 5));
    gs.addEntity(new Link('char', 'D', 'C', 20, 5));
    gs.addEntity(new Link('human', 'HUMAN', 'C', 20, 5));
    gs.addEntity(new Link('human', 'HUMAN', 'B', 20, 5));
    gs.addEntity(new Link('human', 'HUMAN', 'D', 20, 5));
    gs.addEntity(new Link('target', 'A', 'E', 20, 5));*/

}



exports.FCharacter = FCharacter;
exports.Unmoveables = Unmoveables;
exports.Human = Human;
exports.Link = Link;
exports.fstartGame = fstartGame;
exports.createForceUpdMsg = createForceUpdMsg;
exports.recalculate = recalculate;
exports.all = all;
exports.printAll = printAll;
exports.deleteAll = deleteAll;