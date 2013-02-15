define(["canvas", "resources", "keys", "menu", "stars", "enemy", "effects", "bullet", "powerup", "raf", "ParticleSystem"], function(Canvas, Resources, keys, Menu, Stars, Enemy, effects, Bullet, Powerup, raf, PS) {
	Canvas.size(window.innerWidth, window.innerHeight);

	Resources.on("load", function() {
		console.log("loaded");
		game.run();
		console.log(Canvas.size());
	});
	Resources.load({
		"ships": "images/spaceships_1.png",
		"logo": "images/spacedefender.png",
		"bomb": "images/fire-bomb.png"
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
				bullets.push(Bullet({X: ship.X + 11, Y: ship.Y - 25}, enemies));				
			}			
		}
	}
	var down = {};
	var enemies = [];
	var powerups = [];
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
				if(powerups[i].draw()) {
					powerups.splice(i, 1);
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
		var enemy = Enemy(Resources.images.ships, {X: Math.random() * Canvas.width | 0, Y: 0});
		enemy.on("death", function() {
			powerups.push(Powerup(Resources.images.bomb, function() { alert("boop"); }, this.position));
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