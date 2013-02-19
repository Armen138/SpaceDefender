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
		"doubleshot": "images/double-shot.png",
		"heal": "images/heal.png",
		"rocket": "images/rocket.png",
		"homing": "images/on-target.png",
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


	var enemyWeapons = {
		gun: {
			loadTime: 5000,
			ammo: function(position, enemies) {
				return Bullet(position, [ship], {"south": true, damage: 3})
			}
		}
	};

	var weapons = {
		gun: {
			loadTime: 100,
			ammo: Bullet
		},
		doubleBarrel: {
			loadTime: 150,
			ammo: function(position, enemies) {
				return Bullet(position, enemies, { "double" : true, damage: 3 });
			}			
		},
		rocket: {
			loadTime: 300,
			ammo: function(position, enemies) {
				return Bullet(position, enemies, { rocket: true, speed: 0.3, damage: 10 });
			}
		},
		homingMissile: {
			loadTime: 900,
			ammo: function(position, enemies) {
				return Bullet(position, enemies, { rocket: true, speed: 0.3, damage: 10, homing: true });
			}
		}		
	}

	var bullets = [];
	var lastShot = 0;
	var shield = new PS.ParticleSystem(effects("shield"));
	var burner = new PS.ParticleSystem(effects("afterburner"));
	var shieldAngle = 0;
	var lastShield = 0;
	var ship = {
		position: {X: 100, Y: 100},
		hp: 10,
		shield: 10,
		currentWeapon: weapons.gun,
		enableShield: false,
		loadTime: 100,
		hit: function(damage) {
			ship.hp -= damage;
			if(ship.hp < 0) {
				ship.die();
			}
			console.log(ship.hp);
		},		
		die: function() {
			console.log("death");
		},
		draw: function() {
			//264,945
			//22,25
				Canvas.context.save();
				var angle = -90 * 0.0174532925;
				Canvas.context.translate(ship.position.X, ship.position.Y);
				Canvas.context.rotate(angle);
				Canvas.context.drawImage(Resources.images.ships, 264, 945, 22, 25, 0, 0, 22, 25);
				Canvas.context.restore();	
				var x = ship.position.X + 11 + 32 * Math.cos(shieldAngle);
				var y = ship.position.Y - 12 + 32 * Math.sin(shieldAngle);
				shieldAngle += 0.2;
				if(shieldAngle > 2 * Math.PI) {
					shieldAngle = 0;
				}
				burner.draw(Canvas.element, ship.position.X + 11, ship.position.Y, 17);	
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
			if(ship.shield <= 0) {
				ship.enableShield = false;
			}			
		},
		left: function() {
			ship.position.X -=10;
		},
		right: function() {
			ship.position.X += 10;
		},
		up: function() {
			ship.position.Y -= 10;
		}, 
		down: function() {
			ship.position.Y += 10;
		},
		fire: function() {
			if(Date.now() - lastShot > ship.currentWeapon.loadTime) {
				lastShot = Date.now();
				bullets.push(ship.currentWeapon.ammo({X: ship.position.X + 11, Y: ship.position.Y - 25}, enemies));
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
				powerups[i].collect({X: ship.position.X, Y: ship.position.Y} );
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
    	powerupQueue.shift();
    	var blast = new PS.ParticleSystem(effects("powerup", Resources.images.star));
    	systems.push({
    		effect: blast,
    		X: ship.position.X,
    		Y: ship.position.Y
    	});
    }

    var shieldPowerup = {
    	image: Resources.images.shield,
    	action: function() {
    		getPowerup();
    		ship.shield = 10;
    		ship.enableShield = true;
    	}
    }

    var doublePowerup = {
    	image: Resources.images.doubleshot,
    	action: function() {
    		getPowerup();
    		ship.currentWeapon = weapons.doubleBarrel;
    	}
    }

    var rocketPowerup = {
    	image: Resources.images.rocket,
    	action: function() {
    		getPowerup();
    		ship.currentWeapon = weapons.rocket;
    	}
    }

    var homingPowerup = {
    	image: Resources.images.homing,
    	action: function() {
    		getPowerup();
    		ship.currentWeapon = weapons.homingMissile;
    	}
    }

    var healPowerup = {
    	image: Resources.images.heal,
    	action: function() {
    		getPowerup();
    		ship.hp++;
    		console.log(ship.hp);
    	}    	
    }
    var powerupQueue = [shieldPowerup, doublePowerup, rocketPowerup, homingPowerup, healPowerup];
    var shipTiles = [
	    {
			width: 22,
			height: 25,
			X: 264,
			Y: 945    	
	    },
	    {
			width: 22,
			height: 25,
			X: 264,
			Y: 945    	
	    }	    
    ];
    game.state = home;
	setInterval(function() {
		var tile = Math.random() * 2 | 0;
		var enemy = Enemy(Resources.images.ships, {X: Math.random() * Canvas.width | 0, Y: 0}, enemyWeapons.gun, bullets);
		enemy.on("death", function() {
			var pu;
			if(powerupQueue.length > 0) {
				pu = powerupQueue[0];
			} else {
				pu = healPowerup;
			}
			if(Math.random() > 0.9) {
				powerups.push(Powerup(pu.image, pu.action, this.position));
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
		/*if(e.keyCode === keys.SHIFT) {
			console.log("switch to double shot");
			ship.currentWeapon = weapons.doubleBarrel;
		}*/
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