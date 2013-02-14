define(["canvas", "resources", "keys", "menu", "raf", "ParticleSystem"], function(Canvas, Resources, keys, Menu, raf, PS) {
	Canvas.size(window.innerWidth, window.innerHeight);
	//Canvas.size(1080, 700);
	//Canvas.element.style.width = "auto";
	//Canvas.element.style.height = "100%";
	var bulletPS = function() {
		return {"emitterStartLocation":{"x":0,"y":0},"emitterStopLocation":{"x":0,"y":0},"systemLifeSpan":0,"particleSpawnArea":{"x":0,"y":0},"maxParticles":300,"averageLifeSpan":0.3,"lifeSpanVariance":0.1,"startColor":{"red":255,"green":167,"blue":63,"alpha":1},"stopColor":{"red":0,"green":0,"blue":0,"alpha":1},"averageVelocity":{"horizontal":0,"vertical":0},"velocityVariance":{"x":0.3,"y":0.3},"minParticleSize":2,"maxParticleSize":4,"particleFadeTime":0.6,"globalCompositeOperation":"lighter","renderType":"spriteSheet","type":"relative"};
	};
	var shieldPS = function() {
		return {"emitterStartLocation":{"x":0,"y":0},"emitterStopLocation":{"x":0,"y":0},"systemLifeSpan":0,"particleSpawnArea":{"x":0,"y":0},"maxParticles":300,"averageLifeSpan":0.3,"lifeSpanVariance":0.1,"startColor":{"red":63,"green":167,"blue":255,"alpha":1},"stopColor":{"red":0,"green":0,"blue":0,"alpha":1},"averageVelocity":{"horizontal":0,"vertical":0},"velocityVariance":{"x":0.3,"y":0.3},"minParticleSize":2,"maxParticleSize":4,"particleFadeTime":0.6,"globalCompositeOperation":"lighter","renderType":"spriteSheet","type":"relative"};
	}
	Resources.on("load", function() {
		console.log("loaded");
		game.run();
		console.log(Canvas.size());
	});
	Resources.load({
		"ships": "images/spaceships_1.png",
		"logo": "images/spacedefender.png"
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

	var stars = function() {
		var starMap = [];
		var maxStars = 100;
		var maxLayers = 4;
		for(var l = 0; l < maxLayers; l++) {
			starMap[l] = [];
			for(var i = 0; i < maxStars; i++) {
				starMap[l].push({X: Math.random() * Canvas.width | 0, 
								Y: Math.random() * Canvas.height | 0});
			}					
		}
		var s = {
			draw: function() {
				for(var l = 0; l < starMap.length; l++) {
					var shade = 200 / (l + 1);
					Canvas.context.fillStyle = "rgb(" + shade + "," + shade + "," + shade + ")";
					for(var i = 0; i < starMap[l].length; i++) {
						Canvas.context.fillRect(starMap[l][i].X, starMap[l][i].Y, 2, 2);
						starMap[l][i].Y += (1 / l);
						if(starMap[l][i].Y > Canvas.height) {
							starMap[l][i].Y -= Canvas.height;
						}
					}					
				}
			}
		}
		return s;
	}
	var enemy = function(position) {
		var start = Date.now();
		var speed = 0.2;
		var dead = false;
		var hp = 10;
		var startPosition = {X: position.X, Y: position.Y};
		var e = {
			position: position,
			hit: function(damage) {
				hp -= damage;
				if(hp < 0) {
					e.die();
				}
			},
			die: function() {
				dead = true;
			},
			draw: function() {
				position.Y = startPosition.Y + ((Date.now() - start) * speed);
				Canvas.context.save();
				var angle = 90 * 0.0174532925;
				Canvas.context.translate(position.X, position.Y);
				Canvas.context.rotate(angle);
				Canvas.context.drawImage(Resources.images.ships, 264, 945, 22, 25, 0, 0, 22, 25);
				Canvas.context.restore();
				if(position.Y > Canvas.height || dead) {
					return true;
				}						
				return false;
			}
		}
		return e;
	};

	var bullet = function(position) {
		var start = Date.now();
		var speed = 0.7;
		var dead = false;
		var baseY = position.Y;
		var baseX = position.X;
		var trail = new PS.ParticleSystem(bulletPS());
		var b = {
			draw: function() {
				trail.draw(Canvas.element, position.X, position.Y, 17);
				position.Y = baseY - ((Date.now() - start) * speed);
				//position.X = baseX - ((Date.now() - start) * speed);
				if(position.Y < -10 && !dead) {
					trail.kill();
					dead = true;
				}
				for(var i = 0; i < enemies.length; i++) {
					if((Math.abs(enemies[i].position.X - position.X) < 30) &&
					   (Math.abs(enemies[i].position.Y - position.Y) < 30)) {
					   	enemies[i].die();
					   	trail.kill();
					   	dead = true;
					   }
				}
				if(trail.isDone()) {
					return true;
				}
				return false;
			}
		};	
		return b;
	};
	var bullets = [];
	var lastShot = 0;
	var shield = new PS.ParticleSystem(shieldPS());
	var shieldAngle = 0;
	var lastShield = 0;
	var ship = {
		X: 100,
		Y: 100,
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

				shield.draw(Canvas.element, x, y, 17);
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
				bullets.push(bullet({X: ship.X + 11, Y: ship.Y - 25}));				
			}			
		}
	}
	var down = {};
	var enemies = [];
	var starField = stars();
	/*
	var game = {
		run: function() {
			Canvas.clear("black");
			starField.draw();
			ship.draw();
			for(var i = enemies.length - 1; i >= 0; --i) {
				if(enemies[i].draw()) {
					enemies.splice(i, 1);
				}
			}
			setTimeout(game.run, 17);
		},
		controls: {
			up: keys.UP,
			down: keys.DOWN,
			left: keys.LEFT,
			right: keys.RIGHT,
			fire: keys.SPACE
		}
	};*/

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
				Canvas.clear();
				if(game.state) {
					game.state.run();	
				}
				raf.requestAnimationFrame.call(window, game.run);				
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

    game.state = home;
	setInterval(function() {
		enemies.push(enemy({X: Math.random() * Canvas.width | 0, Y: 0}));
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