define(["canvas", "resources", "keys", "menu", "stars", "enemy", "effects", "bullet", "powerup", "raf", "ParticleSystem", "stats.min"], function(Canvas, Resources, keys, Menu, Stars, Enemy, effects, Bullet, Powerup, raf, PS) {
	//Canvas.size(window.innerWidth, window.innerHeight);

	Canvas.size(800, 600);

	var stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';

	document.body.appendChild( stats.domElement );

	Resources.on("load", function() {
		console.log("loaded");
		game.run();
		console.log(Canvas.size());
	});
	Resources.load({
		"ships": "images/spaceships_1.png",
		"logo": "images/spacedefender.png",
		"bomb": "images/fire-bomb.png",
		"shield": "images/edged-shield.png",
		"star": "images/star.png"
	});	


	var paused = Menu(Canvas.element, [
			{
				label: "Resume",
				action: function() {
					game.state = play;
				}
			},
			{
				label: "Menu",
				action: function() {
					game.state = home;
				}
			}
		]);
	var home = Menu(Canvas.element, [
			{
				label: "Play",
				action: function() {
					//alert("play");
					game.state = play;
				}
			},
			{
				label: "Survival",
				action: function() {
					alert("survival");
				}
			},
			{
				label: "Credits",
				action: function() {
					alert("credits");
				}
			}
		], Resources.images.logo);


	var bullets = [];
	var lastShot = 0;
	var shield = new PS.ParticleSystem(effects("shield"));
	var burner = new PS.ParticleSystem(effects("afterburner"));
	var shieldAngle = 0;
	var lastShield = 0;
	var ship = {
		X: 100,
		Y: 100,
		enableShield: false,
		loadTime: 100,
		draw: function() {
			//264,945
			//22,25
				Canvas.context.save();
				var angle = -90 * 0.0174532925;
				Canvas.context.translate(ship.X, ship.Y);
				Canvas.context.rotate(angle);
				Canvas.context.drawImage(Resources.images.ships, 264, 945, 22, 25, 0, 0, 22, 25);
				Canvas.context.restore();	
				var x = ship.X + 11 + 32 * Math.cos(shieldAngle);
				var y = ship.Y - 12 + 32 * Math.sin(shieldAngle);
				shieldAngle += 0.2;
				if(shieldAngle > 2 * Math.PI) {
					shieldAngle = 0;
				}
				burner.draw(Canvas.element, ship.X + 11, ship.Y, 17);	
				if(ship.enableShield) {
					shield.draw(Canvas.element, x, y, 17);	
				}
				
			for(var i = bullets.length -1; i >= 0; --i) {
				if(bullets[i].draw()) {
					bullets.splice(i, 1);
				}
			}

			if(down[play.controls.left]) {
				ship.left();
			}
			if(down[play.controls.right]) {
				ship.right();
			}			
			if(down[play.controls.up]) {
				ship.up();
			}			
			if(down[play.controls.down]) {
				ship.down();
			}			
			if(down[play.controls.fire]) {
				ship.fire();
			}				
		},
		left: function() {
			ship.X -=10;
		},
		right: function() {
			ship.X += 10;
		},
		up: function() {
			ship.Y -= 10;
		}, 
		down: function() {
			ship.Y += 10;
		},
		fire: function() {
			if(Date.now() - lastShot > ship.loadTime) {
				lastShot = Date.now();
				bullets.push(Bullet({X: ship.X + 11, Y: ship.Y - 25}, enemies));				
			}			
		}
	}
	var down = {};
	var enemies = [];
	var powerups = [];
	var systems = [];
	var starField = Stars(Canvas);
	var play = {
		init: function() {},
		clear: function(cb) {
			cb();
		},
		run: function() {
			Canvas.clear("black");
			starField.draw();
			ship.draw();
			for(var i = enemies.length - 1; i >= 0; --i) {
				if(enemies[i].draw()) {
					enemies.splice(i, 1);
				}
			}		
			for(var i = powerups.length - 1; i >= 0; --i) {
				powerups[i].collect({X: ship.X, Y: ship.Y} );
				if(powerups[i].draw()) {
					powerups.splice(i, 1);
				}
			}
			for(var i = systems.length -1; i >= 0; --i) {
				systems[i].effect.draw(Canvas.element, systems[i].X, systems[i].Y, 17);
				if(systems[i].effect.isDone()) {
					systems.splice(i, 1);
				}
			}					
		},
		controls: {
			up: keys.UP,
			down: keys.DOWN,
			left: keys.LEFT,
			right: keys.RIGHT,
			fire: keys.SPACE
		}
	};
	var game = {
			run: function() {
				stats.begin();
				Canvas.clear();
				if(game.state) {
					game.state.run();	
				}
				raf.requestAnimationFrame.call(window, game.run);				
				stats.end();
			}
		},
		state = null;

    Object.defineProperty(game, "state", {
        get: function() {
            return state;
        },
        set: function(newstate) {        	
            if(state) {
                state.clear(function() {
                    newstate.init();
                    state = newstate;                    
                });
            } else {
                newstate.init();
                state = newstate;                
            }
        }
    });

    function getPowerup() {
    	//play powerup noise
    	//show particle fun
    	var blast = new PS.ParticleSystem(effects("powerup", Resources.images.star));
    	systems.push({
    		effect: blast,
    		X: ship.X,
    		Y: ship.Y
    	});
    }

    var shieldPowerup = {
    	image: Resources.images.shield,
    	action: function() {
    		getPowerup();
    		ship.enableShield = true;
    	}
    }
    game.state = home;
	setInterval(function() {
		var enemy = Enemy(Resources.images.ships, {X: Math.random() * Canvas.width | 0, Y: 0});
		enemy.on("death", function() {
			if(Math.random() > 0.9) {
				powerups.push(Powerup(shieldPowerup.image, shieldPowerup.action, this.position));
			}			
			systems.push({
				effect: new PS.ParticleSystem(effects("explosion")),
				X: this.position.X,
				Y: this.position.Y
			});
		});
		enemies.push(enemy);
	}, 1000);

    window.addEventListener("blur", function() {
        if(game.state == play) {
            game.state = paused;            
        }
    });
	
	window.addEventListener("keyup", function(e){		
		down[e.keyCode] = false;
		if(e.keyCode === 27 || e.keyCode === 19) {
			if(game.state == play) {
				game.state = paused;
			}
		}
	});
	window.addEventListener("keydown", function(e) {
		down[e.keyCode] = true;
		e.preventDefault();
	});

	window.addEventListener("click", function(e) {
		if(game.state && game.state.click) {
			game.state.click({X: e.layerX, Y: e.layerY});
		}
	});
	return game;
});