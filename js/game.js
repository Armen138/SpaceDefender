define(["canvas", 
		"resources", 
		"keys", 
		"menu", 
		"stars", 
		"enemy", 
		"enemyTypes", 
		"effects", 
		"bullet", 
		"powerup", 
		"topbar", 
		"raf", 
		"ParticleSystem", 
		"stats.min"], 
	function(Canvas, 
			Resources, 
			keys, 
			Menu, 
			Stars, 
			Enemy, 
			EnemyTypes, 
			effects, 
			Bullet, 
			Powerup, 
			TopBar, 
			raf, 
			PS) {
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

/*
	var enemyWeapons = {
		gun: {
			loadTime: 5000,
			ammo: function(position, enemies) {
				return Bullet(position, [ship], {"south": true, damage: 3})
			}
		},
		doubleBarrel: {		
			loadTime: 1000,
			ammo: function(position, enemies) {
				return Bullet(position, [ship], { "south": true, "double" : true, damage: 6 });
			}			
		}		
	};
*/
	var weapons = {
		gun: {
			toString: function() { return "gun"; },
			loadTime: 100,
			ammo: Bullet
		},
		doubleBarrel: {
			toString: function() { return "double shot"; },
			loadTime: 150,
			ammo: function(position, enemies) {
				return Bullet(position, enemies, { "double" : true, damage: 3 });
			}			
		},
		rocket: {
			toString: function() { return "rocket"; },
			loadTime: 300,
			ammo: function(position, enemies) {
				return Bullet(position, enemies, { rocket: true, speed: 0.3, damage: 10 });
			}
		},
		homingMissile: {
			toString: function() { return "homing missile"; },
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
		width: 25,
		height: 22,
		position: {X: 100, Y: 100},
		hp: 10,
		shield: 0,
		currentWeapon: weapons.gun,
		weaponTime: 0,
		enableShield: false,
		loadTime: 100,
		setWeapon: function(weapon) {
			ship.weaponTime = Date.now();
			ship.currentWeapon = weapon;
		},
		hit: function(damage) {
			if(ship.shield > 0) {
				ship.shield -= damage;
				if(ship.shield < 0) {
					ship.hp += ship.shield;
					ship.shield = 0;
				}
			} else {
				ship.hp -= damage;	
			}			
			if(ship.hp < 0) {
				ship.die();
			}
			console.log(ship.hp);
		},		
		die: function() {
			console.log("death");
		},
		draw: function() {
			if(ship.currentWeapon !== weapons.gun && Date.now() - ship.weaponTime > 10000) {
				ship.currentWeapon = weapons.gun;
				ship.weaponTime = 0;
			}
			//264,945
			//22,25
				Canvas.context.save();
				var angle = -90 * 0.0174532925;
				Canvas.context.translate(ship.position.X, ship.position.Y);
				Canvas.context.rotate(angle);
				Canvas.context.drawImage(Resources.images.ships, 264, 945, 22, 25, 0 - 11, 0 - 12, 22, 25);
				Canvas.context.restore();	
				var x = ship.position.X + 32 * Math.cos(shieldAngle);
				var y = ship.position.Y + 32 * Math.sin(shieldAngle);
				shieldAngle += 0.2;
				if(shieldAngle > 2 * Math.PI) {
					shieldAngle = 0;
				}
				burner.draw(Canvas.element, ship.position.X, ship.position.Y + 11, 17);	
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
				bullets.push(ship.currentWeapon.ammo({X: ship.position.X, Y: ship.position.Y - 12}, enemies));
			}			
		}
	}
	var enemyTypes = EnemyTypes(ship);
	var down = {};
	var enemies = [];
	var powerups = [];
	var systems = [];
	var starField = Stars(Canvas);
	var topBar;
	var play = {
		score: 0,
		init: function() {
			topBar = TopBar([
				{
					obj: ship,
					prop: "hp",
					name: "health",
					type: "bar"
				},
				{
					obj: ship,
					prop: "currentWeapon",
					name: "weapon",
					type: "string",
					count: 10,
					countStart: "weaponTime"
				},
				{
					name: "shield",
					obj: ship,
					prop: "shield",
					type: "bar"
				},
				{
					name: "score",
					obj: play,
					prop: "score",
					type: "string"
				}		
			]);
		},
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
			topBar.draw();	
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
    		/*
    		topBar.items.push({
    			name: "shield",
    			obj: ship,
    			prop: "shield",
    			type: "bar"
    		});
			*/
    	}
    }

    var doublePowerup = {
    	image: Resources.images.doubleshot,
    	action: function() {
    		getPowerup();
    		ship.setWeapon(weapons.doubleBarrel);
    	}
    }

    var rocketPowerup = {
    	image: Resources.images.rocket,
    	action: function() {
    		getPowerup();
    		ship.setWeapon(weapons.rocket);
    	}
    }

    var homingPowerup = {
    	image: Resources.images.homing,
    	action: function() {
    		getPowerup();
    		ship.setWeapon(weapons.homingMissile);
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

    game.state = home;
	setInterval(function() {
		var tile = (Math.random() * 3) | 0;
		var type = ["pirate", "schooner", "destroyer"][tile];
		var enemy = Enemy(Resources.images.ships, {X: Math.random() * Canvas.width | 0, Y: 0}, enemyTypes[type].weapon, bullets, enemyTypes[type].sprite, enemyTypes[type].options);
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
			play.score += this.score;
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