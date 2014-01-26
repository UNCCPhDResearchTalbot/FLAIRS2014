var fcanvas = document.getElementById('forcecanvas');

//define vars for force vector stuff

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

var fcharacters = null;
var targets = null;
var center = null;
var all = null;
var edges = null;
var humans = null;
var fgsglob = null;
var forcestartGame = null;


function findFItem(type, name1, name2) {
	switch (type) {
		case "R":
			return center;
			break;
		case "A":
			// loop through all objects
			for(var i = 0; i < all.length; i++) {
				if(all[i].name == name1) {
					return all[i];
				}
			}
			break;
		case "L":
			// loop through all edges
			for(var i = 0; i < edges.length; i++) {
				if(edges[i].point1.name == name1 && edges[i].point2.name == name2) {
					return edges[i];
				} else if (edges[i].point1.name == name2 && edges[i].point2.name == name1) {
					return edges[i];
				}
			}
			break;
		case "T":
			// loop through all targets
			for(var i = 0; i < targets.length; i++) {
				if(targets[i].name == name1) {
					return targets[i];
				}
			}
			break;
		case "H":
			// loop through all humans
			for(var i = 0; i < humans.length; i++) {
				if(humans[i].name == name1) {
					return humans[i];
				}
			}
			break;
		case "C":
			// loop through all chars
			for(var i = 0; i < fcharacters.length; i++) {
				if(fcharacters[i].name == name1) {
					return fcharacters[i];
				}
			}
			break;
		default:
			// error!!
			console.log("couldn't find " + type + " with name=" + name);
			return null;
			break;
		}
	
		// error!!
		console.log("couldn't find " + type + " with name=" + name);
		return null;
	
}


//---------------------------------------------------------------

 function FCharacter(name, x, y, rank, onstage, links) {
        this.name = name;
        this.type = 'char';
        this.x = x;
        this.y = y;
        this.rank = rank;
        this.onstage = onstage;
        

        

        if (fcharacters == null) {
            fcharacters = new Array();
            fcharacters[0] = this;
        } else {
            fcharacters[fcharacters.length] = this;
            
        }
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
        	// remove from fcharacters array
        	//var which = findFItem('C', this.name);
        	var index = fcharacters.indexOf(this);
        	fcharacters.splice(index,1);
        	
        	// remove from all array
        	index = all.indexOf(this);
        	all.splice(index,1);
        	// remove center if count is less than 2
        	// remove from draw
        	fgsglob.delEntity(this);
			//delete this; // might not work to destroy this instance?
        }
		//console.log("Created Char "+this.name);
        this.draw = function(c, gs) {// draw with pos, not x/y -- maybe do a check if done recalculating & only update x/y with pos at that time & draw x/y?
            //c = document.getElementById('forcecanvas').getContext('2d');
            //if (this.onstage) {
                c.fillStyle = 'rgba(0, 255, 0, 1.0)';
                // green
                c.beginPath();
                c.arc(this.x, this.y, 10, 0, Math.PI * 2, true);
                c.closePath();
                c.fill();
                c.fillStyle = '#000';
                c.font = 'bold 14px sans-serif';
                c.textBaseline = 'middle';
                c.textAlign = 'center';
                c.fillText(this.name, this.x, this.y);
                c.stroke();
           // }
        }
    }

    function Unmoveables(name, x, y, links) {
        this.name = name;
        this.type = 'target';
        this.x = x;
        this.y = y;
        

        if (all == null) {
            all = new Array();
            all[0] = this;
        } else {
            all[all.length] = this;
        }
        
        this.moveto = function(x,y) {
        	this.x = x;
        	this.y = y;
        }
        
        this.dodelete = function() {
        	//remove all links
        	// remove from fcharacters array
        	//var which = findFItem('C', this.name);
        	
        	
        	// remove from all array
        	var index = all.indexOf(this);
        	all.splice(index,1);
        	// remove center if count is less than 2
        	// remove from draw
        	fgsglob.delEntity(this);
			//delete this; // might not work to destroy this instance?
        }
        //console.log("Created Target "+this.name);

        this.draw = function(c, gs) {
        	//c = document.getElementById('forcecanvas').getContext('2d');
            c.fillStyle = 'rgba(0, 0, 0, 1.0)';
            // black
            c.beginPath();
            c.arc(this.x, this.y, 10, 0, Math.PI * 2, true);
            c.closePath();
            c.fill();
            c.fillStyle = '#FFF';
            c.font = 'bold 14px sans-serif';
            c.textBaseline = 'middle';
            c.textAlign = 'center';
            c.fillText(this.name, this.x, this.y);
            c.stroke();
        }
    }

    function Human(name, x, y, rank, onstage, links) {
        this.name = name;
        this.type = 'human';
        this.x = x;
        this.y = y;

        
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
       
        
        this.doupdate = function(x, y) {
        	this.x = x;
            
            this.y = y;
            
        }
        
        this.dodelete = function() {
        	//remove all links
        	// remove from fcharacters array
        	//var which = findFItem('C', this.name);
        	var index = humans.indexOf(this);
        	humans.splice(index,1);
        	
        	// remove from all array
        	index = all.indexOf(this);
        	all.splice(index,1);
        	// remove center if count is less than 2
        	// remove from draw
        	fgsglob.delEntity(this);
			//delete this; // might not work to destroy this instance?
        }
        //console.log("Created Human "+this.name);
        
        this.draw = function(c, gs) {
        	//c = document.getElementById('forcecanvas').getContext('2d');
            if (this.onstage) {
                c.fillStyle = 'rgba(255, 0, 0, 1.0)';
                // red
                c.beginPath();
                c.arc(this.x, this.y, 10, 0, Math.PI * 2, true);
                c.closePath();
                c.fill();
                c.fillStyle = '#000';
                c.font = 'bold 14px sans-serif';
                c.textBaseline = 'middle';
                c.textAlign = 'center';
                c.fillText(this.name, this.x, this.y);
                c.stroke();
            }
        }
    }

 function Center(x,y) {
        this.name = "CENTER";
        this.type = 'center';
        
        this.x = x;
        this.y = y;
        this.ismoveable = true;
        
        center = this;
        
        if (all == null) {
            all = new Array();
            all[0] = this;
        } else {
            all[all.length] = this;
        }
        if (fcharacters == null) {
            fcharacters = new Array();
            fcharacters[0] = this;
        } else {
            fcharacters[fcharacters.length] = this;
        }
        
        this.dodelete = function() {
        	//remove all links
        	// remove from fcharacters array
        	//var which = findFItem('C', this.name);
        	var index = fcharacters.indexOf(this);
        	fcharacters.splice(index,1);
        	
        	// remove from all array
        	index = all.indexOf(this);
        	all.splice(index,1);
        	// remove center if count is less than 2
        	// remove from draw
        	fgsglob.delEntity(this);
			//delete this; // might not work to destroy this instance?
        }
        
        
        this.updpos = function(x, y) {
            
            this.x = x;
            this.y = y;
            
        }

       //console.log("Created Center "+this.name);
        
        this.draw = function(c, gs) {
            //c = document.getElementById('forcecanvas').getContext('2d');
            c.fillStyle = 'rgba(0,0,255,1)';
            // black
            c.lineWidth = 1;
            c.beginPath();
            c.arc(this.x, this.y, 3, 0, Math.PI * 2, true);
            c.closePath();
            c.fill();
            c.stroke();
        }
    }

    function Audience(name, x, y) {
        this.name = name;
        this.type = 'audience';
        this.x = x;
        this.y = y;
        this.ismoveable = false;
        
        if (all == null) {
            all = new Array();
            all[0] = this;
        } else {
            all[all.length] = this;
        }

		this.dodelete = function() {
        	//remove all links
        	// remove from fcharacters array
        	//var which = findFItem('C', this.name);
        	
        	
        	// remove from all array
        	var index = all.indexOf(this);
        	all.splice(index,1);
        	// remove center if count is less than 2
        	// remove from draw
        	fgsglob.delEntity(this);
			//delete this; // might not work to destroy this instance?
        }
        
        //console.log("Created Aud "+this.name);
        
        this.draw = function(c, gs) {
        	//c = document.getElementById('forcecanvas').getContext('2d');
            c.fillStyle = 'rgba(0,0,0,1)';
            // black
            c.lineWidth = 1;
            c.beginPath();
            c.arc(this.x, this.y, 3, 0, Math.PI * 2, true);
            c.closePath();
            c.fill();
            c.stroke();
        }
    }
    


    function Link(type, point1, point2, attraction, repel) {
        this.type = type;
        var which1 = null;
        var which2 = null;
        if (fcharacters != null) {
            for (var i = 0; i < all.length; i++) {
                if (all[i].name == point1) {
                    which1 = all[i];
                    if (all[i].links != null){
                    	all[i].links[all[i].links.length] = this;
                    } else {
                    	all[i].links = new Array();
                    	all[i].links[0] = this;
                    }
                    // add to the character's list
                }
                if (all[i].name == point2) {
                    which2 = all[i];
                    if (all[i].links != null) {
                    	all[i].links[all[i].links.length] = this;
                    } else {
                    	all[i].links = new Array();
                    	all[i].links[0] = this;
                    }
                    // add to the character's list
                }
            }
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
        
        this.dodelete = function() {
        	//remove all links
        	// remove from fcharacters array
        	//var which = findFItem('C', this.name);
        	var index = edges.indexOf(this);
        	edges.splice(index,1);
        	
        	// remove from all array
        	//index = all.indexOf(this);
        	//all.splice(index,1);
        	// remove center if count is less than 2
        	// remove from draw
        	fgsglob.delEntity(this);
			//delete this; // might not work to destroy this instance?
        }

//console.log("Created Link "+this.type+":"+this.point1.name+","+this.point2.name);
        this.draw = function(c, gs) {
        	//c = document.getElementById('forcecanvas').getContext('2d');
            if (this.type == 'audience') {
                c.lineWidth = .5;
            } else {
                c.lineWidth = .5;
            }
            c.strokeStyle = 'rgba(0,0,0,1.0)';
            c.beginPath();
            c.moveTo(this.point1.x, this.point1.y);
            c.lineTo(this.point2.x, this.point2.y);
            c.stroke();
            c.closePath();
           // c.fillStyle = '#000';
           // c.font = 'bold 10px sans-serif';
           // c.textBaseline = 'bottom';
           // c.fillText(getLength(this.point1, this.point2), this.point2.x - ((this.point2.x - this.point1.x) / 2), this.point2.y - ((this.point2.y - this.point1.y) / 2));
          //  c.stroke();
        }
    }


//---------------------------------------------------------------



forcestartGame = function(gs) {
//function startGame(gs) {
    fgsglob = gs;
    //start with only the mousedown event attached
    fcanvas = document.getElementById('forcecanvas');
    fcanvas.addEventListener("mousedown", mousedown);

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

    fcharacters = null;
    targets = null;
    all = null;
    edges = null;
    humans = null;

    function mousedown(e) {
        //...calc coords into mouseX, mouseY
        var mouseX = e.layerX;
        var mouseY = e.layerY;

        for ( i = 0; i < humans.length; i++) {//loop in reverse draw order

            var dx = mouseX - humans[i].x;
            var dy = mouseY - humans[i].y;

            if (Math.sqrt((dx * dx) + (dy * dy)) < 20) {
                dragIdx = i;
                //store the item being dragged
                dragOffsetX = dx;
                //store offsets so item doesn't 'jump'
                dragOffsetY = dy;
                movelistener = fcanvas.addEventListener("mousemove", mousemove);
                //start dragging
                uplistener = fcanvas.addEventListener("mouseup", mouseup);
                return;
            }
        }
    }

    function mousemove(e) {
        if (dragIdx != -1) {
            var mouseX = e.layerX;
            var mouseY = e.layerY;
            humans[dragIdx].doupdate(mouseX + dragOffsetX, mouseY + dragOffsetY);
           /* humans[dragIdx].x = mouseX + dragOffsetX;
            humans[dragIdx].pos.x = humans[dragIdx].x;
            //drag your item
            humans[dragIdx].y = mouseY + dragOffsetY;
            humans[dragIdx].pos.y = humans[dragIdx].y;
            humans[dragIdx].links[0].point2.x = humans[dragIdx].x;*/
        }
    }

    function mouseup(e) {
        if (dragIdx != -1) {
            //dragIdx = -1;
            //reset for next mousedown
            fcanvas.removeEventListener('mousemove', movelistener, false);
            fcanvas.removeEventListener('mouseup', uplistener, false);
            movelistener = null;
            uplistener = null;
            dragOffsetX = 0;
            dragOffsetY = 0;
            // Need to call the re-calculate function for my force graph!!!!
           // console.log(humans[dragIdx].pos.x+","+humans[dragIdx].pos.y);
            //console.log(humans[dragIdx].orig.x+","+humans[dragIdx].orig.y);
            //console.log(vectsize(vectdiff(humans[dragIdx].pos, humans[dragIdx].orig)));
            if (vectsize(vectdiff(humans[dragIdx].pos, humans[dragIdx].orig)) > (avgdist/4)) {
                recalculate();
                humans[dragIdx].updateorig(humans[dragIdx].pos.x,humans[dragIdx].pos.y);
                //humans[dragIdx].orig.x = humans[dragIdx].pos.x;
                //humans[dragIdx].orig.y = humans[dragIdx].pos.y;
            }

            dragIdx = -1;
        }
    }

   

    function Stage() {
        
        this.draw = function(c,gs) {
        	//c = document.getElementById('forcecanvas').getContext('2d');
            c.lineWidth = .5;
            c.strokeStyle = 'rgba(0,255,0,1.0)';
            c.beginPath();
            c.moveTo(bufferW, bufferL);
            c.lineTo(bufferW+W, bufferL);
            c.lineTo(bufferW+W, bufferL+L);
            c.lineTo(bufferW, bufferL+L);
            c.lineTo(bufferW, bufferL);
            c.stroke();
            c.closePath();
            c.strokeStyle = 'rgba(0,0,0,1.0)';
            c.beginPath();
            c.moveTo(0.1,0);
            c.lineTo(0.1,L+(2*bufferL));
            c.stroke();
            c.closePath();
        }
    }

  //  gs.addEntity(new Stage());
    
    /* create chars needed for play from client.js's creation stuff */
   
 /*   gs.addEntity( c1 = new Character('A', 30, 50, 1, true, null));
    gs.addEntity( c2 = new Character('B', 100, 50, 2, true, null));
    gs.addEntity( c3 = new Character('C', 200, 150, 5, true, null));
    gs.addEntity( c4 = new Character('D', 30, 150, 4, true, null));
    gs.addEntity( u1 = new Unmoveables('E', 200, 400, null));
    gs.addEntity( h1 = new Human('Human',400, 200, 3, true, null));
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