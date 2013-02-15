define(function() {
	return function(effect) {
		switch(effect) {
			case "bullet":
				return {"emitterStartLocation":{"x":0,"y":0},"emitterStopLocation":{"x":0,"y":0},"systemLifeSpan":0,"particleSpawnArea":{"x":0,"y":0},"maxParticles":300,"averageLifeSpan":0.3,"lifeSpanVariance":0.1,"startColor":{"red":255,"green":167,"blue":63,"alpha":1},"stopColor":{"red":0,"green":0,"blue":0,"alpha":1},"averageVelocity":{"horizontal":0,"vertical":0},"velocityVariance":{"x":0.3,"y":0.3},"minParticleSize":2,"maxParticleSize":4,"particleFadeTime":0.6,"globalCompositeOperation":"lighter","renderType":"spriteSheet","type":"relative"};
			break;
			case "shield":
				return {"emitterStartLocation":{"x":0,"y":0},"emitterStopLocation":{"x":0,"y":0},"systemLifeSpan":0,"particleSpawnArea":{"x":0,"y":0},"maxParticles":300,"averageLifeSpan":0.3,"lifeSpanVariance":0.1,"startColor":{"red":63,"green":167,"blue":255,"alpha":1},"stopColor":{"red":0,"green":0,"blue":0,"alpha":1},"averageVelocity":{"horizontal":0,"vertical":0},"velocityVariance":{"x":0.3,"y":0.3},"minParticleSize":2,"maxParticleSize":4,"particleFadeTime":0.6,"globalCompositeOperation":"lighter","renderType":"spriteSheet","type":"relative"};
			break;
		}
	}
});
