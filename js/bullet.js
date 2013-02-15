define(["ParticleSystem", "canvas", "effects"], function(PS, Canvas, effects) {
	var bullet = function(position, enemies) {
		var start = Date.now();
		var speed = 0.7;
		var dead = false;
		var baseY = position.Y;
		var baseX = position.X;
		var trail = new PS.ParticleSystem(effects("bullet"));
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
	return bullet;
});
