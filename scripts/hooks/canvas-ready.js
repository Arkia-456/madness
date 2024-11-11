export const CanvasReady = {
	listen: () => {
		Hooks.on('canvasReady', () => {
			game.madness.effectsTracker.render(true);
		});
	},
};
