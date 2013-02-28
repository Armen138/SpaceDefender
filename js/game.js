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
        "gamepad",
        "waves",
        "racket",
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
            gamePad,
            Waves,
            racket,
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
        "logo": "images/spacedefender800.png",
        "bomb": "images/fire-bomb.png",
        "shield": "images/edged-shield.png",
        "doubleshot": "images/double-shot.png",
        "heal": "images/heal.png",
        "rocket": "images/rocket.png",
        "homing": "images/on-target.png",
        "star": "images/star.png",
        "gameover": "images/gameover.png"
    });

    Resources.audio = {
        "select": racket.create("audio/select.wav"),
        "explosion": racket.create("audio/explosion.wav"),
        "rapidfire": racket.create("audio/rapidfire.wav"),
        "shoot": racket.create("audio/shoot.wav"),
        "shoot2": racket.create("audio/shoot2.wav"),
        "rocket": racket.create("audio/rocket.wav"),
        "rocket2": racket.create("audio/rocket2.wav"),
        "pickup": racket.create("audio/pickup.wav"),
        "strange": racket.create("audio/strange.ogg"),
        "enemyshoot": racket.create("audio/enemyshoot.wav"),
        "error": racket.create("audio/error.wav")
    };
    var gameover = Menu(Canvas.element, [
            {
                label: "Restart",
                action: function() {
                    play.reset();
                    game.state = play;
                }
            },
            {
                label: "Menu",
                action: function() {
                    game.state = home;
                }
            }
        ], Resources.images.gameover);

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
                    play.reset();
                    play.mode = "waves";
                    game.state = play;
                }
            },
            {
                label: "Survival",
                action: function() {
                    play.reset();
                    play.mode = "survival";
                    game.state = play;
                }
            },
            {
                label: "Credits",
                action: function() {
                    //alert("credits");
                    document.getElementById("credits").style.display = "block";
                }
            }
        ], Resources.images.logo);

    var weapons = {
        gun: {
            toString: function() { return "gun"; },
            loadTime: 100,
            ammo: Bullet,
            sound: "shoot"
        },
        doubleBarrel: {
            toString: function() { return "double shot"; },
            loadTime: 150,
            ammo: function(position, enemies) {
                return Bullet(position, enemies, { "double" : true, damage: 3 });
            },
            sound: "shoot2"
        },
        rocket: {
            toString: function() { return "rocket"; },
            loadTime: 300,
            ammo: function(position, enemies) {
                return Bullet(position, enemies, { rocket: true, speed: 0.3, damage: 10 });
            },
            sound: "rocket"
        },
        homingMissile: {
            toString: function() { return "homing missile"; },
            loadTime: 900,
            ammo: function(position, enemies) {
                return Bullet(position, enemies, { rocket: true, speed: 0.3, damage: 10, homing: true });
            },
            sound: "rocket2"
        }
    };

    var bullets = [];
    var lastShot = 0;
    var shield = new PS.ParticleSystem(effects("shield"));
    var burner = new PS.ParticleSystem(effects("afterburner"));
    var shieldAngle = 0;
    var lastShield = 0;
    var ship = {
        width: 25,
        height: 22,
        position: {X: 400, Y: 500},
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
            game.state = gameover;
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
        	if(ship.position.X < 32) {
        		ship.position.X = 32;
        		return;
        	}
            ship.position.X -=10;
        },
        right: function() {
        	if(ship.position.X > 768) {
        		ship.position.X = 768;
        		return;
        	}
            ship.position.X += 10;
        },
        up: function() {
        	if(ship.position.Y < 32) {
        		ship.position.Y = 32;
        		return;
        	}
            ship.position.Y -= 10;
        },
        down: function() {
        	if(ship.position.Y > 568) {
        		ship.position.Y = 568;
        		return;
        	}        	
            ship.position.Y += 10;
        },
        fire: function() {
            if(Date.now() - lastShot > ship.currentWeapon.loadTime) {
                lastShot = Date.now();
                bullets.push(ship.currentWeapon.ammo({X: ship.position.X, Y: ship.position.Y - 12}, enemies));
                Resources.audio[ship.currentWeapon.sound].play();
            }
        }
    };
    var enemyTypes = EnemyTypes(ship);
    var powerupQueue;
    var down = {};
    var enemies = [];
    var powerups = [];
    var systems = [];
    var starField = Stars(Canvas);
    var waves;
    var topBar;
    var play = {
        score: 0,
        mode: "waves",
        init: function() {
            Resources.audio.strange.play(true);
            Resources.audio.shoot.volume(0.5);
            Resources.audio.shoot2.volume(0.5);
            Resources.audio.rocket.volume(0.5);
            Resources.audio.rocket2.volume(0.5);
        },
        reset: function() {
            powerupQueue = [shieldPowerup, doublePowerup, rocketPowerup, homingPowerup, healPowerup,
                            shieldPowerup, doublePowerup, rocketPowerup, homingPowerup, healPowerup];
            ship.hp = 10;
            ship.shield = 0;
            ship.position = {X: 400, Y: 500};
            ship.currentWeapon = weapons.gun;
            play.score = 0;
            enemies = [];
            powerups = [];
            waves = Waves();
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
            Resources.audio.strange.stop();
            cb();
        },
        run: function() {
            var now = Date.now();
            var i;
            Canvas.clear("black");
            starField.draw();
            ship.draw();
            for(i = enemies.length - 1; i >= 0; --i) {
                if(enemies[i].draw()) {
                    enemies.splice(i, 1);
                }
            }
            for(i = powerups.length - 1; i >= 0; --i) {
                powerups[i].collect({X: ship.position.X, Y: ship.position.Y} );
                if(powerups[i].draw()) {
                    powerups.splice(i, 1);
                }
            }
            for(i = systems.length -1; i >= 0; --i) {
                systems[i].effect.draw(Canvas.element, systems[i].X, systems[i].Y, 17);
                if(systems[i].effect.isDone()) {
                    systems.splice(i, 1);
                }
            }
            topBar.draw();
            if(play.mode === "waves") {
                if(!play.lastSpawn || waves.length > 0 && now - play.lastSpawn > waves[0].delay) {
                    spawnEnemy(waves[0].type, waves[0].X);
                    waves.shift();
                    play.lastSpawn = now;
                }
            }  else {
                if(!play.lastSpawn || now - play.lastSpawn > 600) {
                    var types = ["schooner", "pirate", "zipper", "hauler", "tube", "shuttle", "waterhauler"];
                    var type = types[Math.random() * types.length | 0];
                    spawnEnemy(type, Math.random() * 800 | 0);
                    play.lastSpawn = now;
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
        Resources.audio.pickup.play();
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
    };

    var doublePowerup = {
        image: Resources.images.doubleshot,
        action: function() {
            getPowerup();
            ship.setWeapon(weapons.doubleBarrel);
        }
    };

    var rocketPowerup = {
        image: Resources.images.rocket,
        action: function() {
            getPowerup();
            ship.setWeapon(weapons.rocket);
        }
    };

    var homingPowerup = {
        image: Resources.images.homing,
        action: function() {
            getPowerup();
            ship.setWeapon(weapons.homingMissile);
        }
    };

    var healPowerup = {
        image: Resources.images.heal,
        action: function() {
            getPowerup();
            ship.hp++;
            console.log(ship.hp);
        }
    };

    var allpowerups = [shieldPowerup, doublePowerup, rocketPowerup, homingPowerup, healPowerup];
    var spawnEnemy = function(type, X) {
        var enemy = Enemy(Resources.images.ships, {X: X || Math.random() * Canvas.width | 0, Y: 0}, enemyTypes[type].weapon, bullets, enemyTypes[type].sprite, enemyTypes[type].options, Resources.audio.enemyshoot);
        enemy.on("death", function() {
            var pu;
            if(play.mode === "waves") {
                if(powerupQueue.length > 0) {
                    pu = powerupQueue[0];
                } else {
                    pu = healPowerup;
                }
            } else {
                pu = allpowerups[Math.random() * allpowerups.length | 0];
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
            Resources.audio.explosion.play();
        });
        enemies.push(enemy);
    };
    game.state = home;

    // setInterval(function() {
    //     var tile = (Math.random() * 3) | 0;
    //     var type = ["pirate", "elder", "zipper"][tile];
    //     spawnEnemy(type);
    // }, 1000);

    window.addEventListener("blur", function() {
        if(game.state == play) {
            game.state = paused;
        }
    });
    
    window.addEventListener("keyup", function(e) {
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

    gamePad.on("axis", function(e) {
        if(e.which === 1) {
            if(e.action === "engage") {
                if(e.value < 0) {
                    down[keys.DOWN] = false;
                    down[keys.UP] = true;
                } else {
                    down[keys.UP] = false;
                    down[keys.DOWN] = true;
                }
            } else {
                down[keys.UP] = false;
                down[keys.DOWN] = false;
            }
        }
        if(e.which === 0) {
            if(e.action === "engage") {
                if(e.value < 0) {
                    down[keys.RIGHT] = false;
                    down[keys.LEFT] = true;
                } else {
                    down[keys.LEFT] = false;
                    down[keys.RIGHT] = true;
                }
            } else {
                down[keys.LEFT] = false;
                down[keys.RIGHT] = false;
            }
        }
    });
    gamePad.on("button", function(e) {
        if(e.action === "down") {
            if(e.which === 0) {
                down[keys.SPACE] = true;
            }
        }
        if(e.action === "up") {
            if(e.which === 0) {
                down[keys.SPACE] = false;
            }
        }
    });
    return game;
});