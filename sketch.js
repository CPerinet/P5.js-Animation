// ================
//
// tDA Asia
//
// ================



// CANVAS
//
//

var cH = window.innerWidth;
var cW = window.innerHeight;


// STATE
//
//

var init = true;

var dotCounter = 200;
var dotCreateRatio = 1; // 0 -> 1
var dots = [];

var clusterCounter = 5;
var clusters = [];
var logos = [];

// SETUP
//
//


function randomI(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function setup() {
  
  // Canvas
  createCanvas(cH,cW);
  
  // FrameRate
  frameRate(60);
}


function draw() {
  background(26,8,50);

  if ( init ) {
    if ( random() < dotCreateRatio ) {
      createDot();
    }

    if ( random() > 0.95 ) {
      createCluster();
    }

    if ( dots.length >= 200 && clusters.length == 5 ) {
      init = false;
    }
  }

  

  for ( i = 0; i < dots.length; i++ ) {

    // Reset
    if ( dots[i].x < 0 || dots[i].x > innerWidth || dots[i].y < 0 || dots[i].y > innerHeight ) {
      dots[i].reset();
    }

    dots[i].update();
    dots[i].draw();
  }

  for ( i = 0; i < clusters.length; i++ ) {

    clusters[i].update();
    clusters[i].draw();
  }
}

function createDot() {
  if ( dots.length < dotCounter ) {
    var x = random() * window.innerWidth;
    var y = random() * window.innerHeight;

    var newDot = new dot(x,y);

    dots.push(newDot);
  }
}

function createCluster() {
  if ( clusters.length < clusterCounter ) {
    var d = randomI(75,200);
    var x = randomI(d+30,window.innerWidth-d-30);
    var y = randomI(d+30,window.innerHeight-d-30);

    var clustersFarEnough = 0;

    if ( clusters.length > 0 ) {
      for ( i=0; i < clusters.length; i++ ) {
        if ( dist(x,y,clusters[i].x,clusters[i].y) > clusters[i].maxD/2 + d/2 + 50 ) {
          clustersFarEnough++;
        }
      } 
      if ( clustersFarEnough == clusters.length ) {
        var newCluster = new cluster(x,y,d,clusters.length);
        clusters.push(newCluster);
      }
    } else {
      var newCluster = new cluster(x,y,d,clusters.length);
      clusters.push(newCluster);
    }
  }
}


function dot(x,y) {

  var _this = this;

  this.x = x;
  this.y = y;

  this.velX = randomI(-2,2);
  this.velY = randomI(-2,2);

  while ( this.velX == 0 && this.velY == 0 ) {
    this.velX = randomI(-2,2);
    this.velY = randomI(-2,2);
  }
  
  this.d = 0.1;
  this.maxD = 12;

  this.colR = 255;
  this.colG = 255;
  this.colB = 255;


  // STATE
  //
  //

  // 0 : starting
  // 1 : moving
  // 2 : getAttracted
  // 3 : fusionning
  // 4 : realased

  this.state = 0;

  // 1
  this.s1time = 0;

  // 2
  this.s2d = {
    i : null
  };
  this.s2x;
  this.s2y;

  this.s2a;
  this.s2b;

  


  this.init = function() {

  }

  this.update = function() {
    
    // STATE
    //
    //

    // 0 : starting
    if ( this.state == 0 ) {
      // next step
      if ( this.d >= this.maxD ) {
        this.state = 1;
      } 
      // step 0
      else {
        this.d *= 1.1;
        this.x += this.velX;
        this.y += this.velY;
      }
    }

    // 1 : moving
    if ( this.state == 1 ) {
      // step
      this.x += this.velX;
      this.y += this.velY;
      this.s1time ++;

      // next step
      if ( this.s1time > 60 ) {
        this.s1time = 0;

        var closest = {
          d : null,
          i : null
        };

        for ( j = 0; j < clusters.length; j++ ) {
          var distance = dist(this.x,this.y,clusters[j].x,clusters[j].y);
          if ( j == 0 ) {
            closest.d = distance;
            closest.i = j;
          } else if ( distance < closest.d  ) {
            closest.d = distance;
            closest.i = j;
          }
        }
        if ( closest.d < 200 && closest.i != _this.s2d.i ) {
          this.s2d = clusters[closest.i];
          this.s2x = clusters[closest.i].x;
          this.s2y = clusters[closest.i].y;
          this.state = 2;
        } 
      }
    }

    // 2 : attracted
    if ( this.state == 2 ) {
      
      // next step
      if ( ( !init ) && ( (Math.abs( this.x - this.s2x ) ) < (this.s2d.maxD/2 - 30) ) && ( ( Math.abs( this.y - this.s2y ) ) < ( this.s2d.maxD / 2 - 30) ) ) {
        _this.s2d.onPlace++;
        _this.state = 3;
      }
      // step 2
      else {
        this.state = -1;
        TweenMax.to(this, 2, 
        {
          bezier:
          {
          values:[{ x : this.x, y : this.y },
                  { x : this.x + this.velX*Math.abs( this.x - this.s2x )*0.1, y : this.y+this.velX*Math.abs( this.y - this.s2y )*0.1 },
                  { x : this.s2x, y : this.s2y }]
          }, ease: Expo.easeOut, onComplete : function() {
            _this.s2d.onPlace++;
            _this.state = 3;
          }
       });
      }
    }

    // 3 : waiting
    if ( _this.state == 3 ) {
      if ( _this.s2d.readyToReleasse > 0 ) {
        this.s2d.readyToReleasse --;
        this.s2d.onPlace --;
        this.released();
      }
    }
  }

  this.reset = function() {
    this.x = random() * window.innerWidth;
    this.y = random() * window.innerHeight;
    this.d = 0.1;
    this.s2time = 0;
    this.state = 0;
  }

  this.released = function() {

    var rayon = dist( this.x,this.y,this.s2x, this.s2y ) + 20;
    
    var tR1 = random( -5, 5 );
    while(tR1 == 0) {
      var tR1 = random( -5, 5 );
    }

    var tR2 = random( -5, 5 );
    while(tR2 == 0) {
      var tR2 = random( -5, 5 );
    }

    this.x = ( this.s2d.d / rayon )*( this.x + tR1-this.s2x )+this.s2x;
    this.y = ( this.s2d.d / rayon )*( this.y + tR2-this.s2y )+this.s2y;
    
    this.d = 0.1;
    this.s2time = 0;
    this.state = 0;
  }


  this.draw = function() {
    noStroke();
    fill(this.colR,this.colG,this.colB);
    ellipse(this.x,this.y,this.d,this.d);
  }
}


function cluster(x,y,d,i) {
  var _this = this;


  this.i = i;
  this.x = x;
  this.y = y;
  this.d = 0.1;
  this.maxD = d;
  this.tmaxD;

  this.colR = 230;
  this.colG = 0;
  this.colB = 126;

  this.dots = [];

  this.isReleassing = false;

  this.readyToReleasse = 0;

  this.maxBeforeReleasse = 35;

  this.realasedBounceDown = false;

  this.realasedBounceUp = false;


  // STATE
  //
  //

  // 0 : hide
  // 1 : start
  // 2 : realasing


  // 2 
  this.onPlace = 0;

  this.state = 0;

  this.update = function() {

    //console.log(this.onPlace);

    // 0 : hide
    if ( this.state == 0 ) {
      //if ( this.onPlace > 0 ) {
        this.state = 1;
      //}
    }

    // 1 : starting
    if ( this.state == 1 ) {

      if ( _this.d < _this.maxD ) {
        _this.d *= 1.1;
      } else if ( _this.d >= _this.maxD ) {
        _this.d = _this.maxD;
        _this.state = 2;
      }
    }

    if ( _this.state == 2 ) {
      if ( _this.onPlace > _this.maxBeforeReleasse && !_this.isReleassing && !_this.realasedBounceDown && !_this.realasedBounceUp ) {
        this.isReleassing = true;
        _this.realasedBounceDown = true;
        _this.readyToReleasse += this.maxBeforeReleasse;
      } else if ( _this.isReleassing && _this.readyToReleasse == 0 ) {
        _this.isReleassing = false;
      }
    }

    if ( _this.realasedBounceDown ) {
      _this.d *= 0.98;
      if ( _this.d < 0.7*_this.maxD ) {
        _this.realasedBounceDown = false;
        _this.realasedBounceUp = true;
      }
    } else if ( _this.realasedBounceUp ) {
      _this.d *= 1.2;
      if ( _this.d > _this.maxD ) {
        _this.d = _this.maxD;
        _this.realasedBounceUp = false;
      }
    }
  }


  this.draw = function() {
    noStroke();
    fill(this.colR,this.colG,this.colB);
    ellipse(this.x,this.y,this.d,this.d);
    this.d -10
  }
}