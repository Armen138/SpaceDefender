define(["canvas"], function(Canvas) {	
	var powerup = function(image, action, position) {
		var start = Date.now();
		var lastScale = 0;
		var scaleTime = 50;
		var scale = 0.5;
		var inc = 0.1;
		return {
			draw: function() {
				//scale = 0.5 + ((Date.now() - start) % 50 / 50);
				if(Date.now() - lastScale > scaleTime) {
					lastScale = Date.now();
					scale += inc;
					if(scale === 1.2 || scale === 0.4) {
						inc *= -1;
					}
				}
				Canvas.context.save();				
				Canvas.context.translate(position.X, position.Y);
				Canvas.context.scale(scale, scale);
				Canvas.context.drawImage(image, -1 * (image.width / 2) * scale,  -1 * (image.height / 2) * scale);
				Canvas.context.restore();
			}
		};		
	};
	return powerup;
})