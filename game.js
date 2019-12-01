let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

const GRAV_CONST = 0.8;
const DT = 1 / 60;
const RADIUS = 16;
const BOUNCINESS = 0.7;
const PLAYER_ACC = 5;
const GAME_STATE = {
	RUNNING: 1,
	DEAD: 2
};

let planets = [];

let mouse = {
	x: 0,
	y: 0,
	down: false
};

let game = {
	state: GAME_STATE.RUNNING,
	ticks: 0,
	highTicks: 0
};

let toTimeStr = function(ticks) {
	let time = ticks / 60;
	let secs = Math.floor(time % 60);
	let mins = Math.floor(time / 60);
	
	return (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs);
}

let generatePlanets = function() {
	for(let i = 0; i < 14; i++) {
		planets.push({
			x: Math.random() * (canvas.width - RADIUS) + RADIUS / 2,
			y: Math.random() * (canvas.height - RADIUS) + RADIUS / 2,
			vx: 0,
			vy: 0,
			ax: 0,
			ay: 0,
			radius: RADIUS,
			mass: RADIUS * RADIUS
		});
	}
	
	/* add player properties to player planet */
	planets[0].heading = 0;
};

let resetGame = function() {
	planets = [];
	generatePlanets();
	game.ticks = 0;
	game.state = GAME_STATE.RUNNING;
};

let step = function() {
	for(let i = 0; i < planets.length; i++) {
		let planet = planets[i];
		
		let xForce = 0; 
		let yForce = 0;
		for(let j = 0; j < planets.length; j++) {
			if(i == j) continue;
			
			let planet2 = planets[j];
			let dx = planet2.x - planet.x;
			let dy = planet2.y - planet.y;
			let distSquared = dx * dx + dy * dy;
			
			let force = GRAV_CONST * planet.mass * planet2.mass / distSquared;
			let dist = Math.sqrt(distSquared);
			xForce += force * dx / dist;
			yForce += force * dy / dist;
		}
		
		/* apply acceleration to velocity */
		planet.vx += xForce / planet.mass + planet.ax;
		planet.vy += yForce / planet.mass + planet.ay;
		
		/* update position */
		planet.x += planet.vx * DT;
		planet.y += planet.vy * DT; 
		
		/* keep planets in boundaries */
		if(planet.x + planet.radius > canvas.width) {
			planet.x = canvas.width - planet.radius;
			planet.vx *= -BOUNCINESS;
		}
		
		if(planet.y + planet.radius > canvas.height) {
			planet.y = canvas.height - planet.radius;
			planet.vy *= -BOUNCINESS;
		}
		
		if(planet.x - planet.radius < 0) {
			planet.x = planet.radius;
			planet.vx *= -BOUNCINESS;
		}
		
		if(planet.y - planet.radius < 0) {
			planet.y = planet.radius;
			planet.vy *= -BOUNCINESS;
		}
		
		/* make sure planets don't collide */
		for(let j = 0; j < planets.length; j++) {
			if(i == j) continue;
			
			let planet2 = planets[j];
			let dx = planet2.x - planet.x;
			let dy = planet2.y - planet.y;
			let dist = Math.sqrt(dx * dx + dy * dy);

			if(dist < planet.radius + planet2.radius) {
				
				if(i == 0) {
					game.state = GAME_STATE.DEAD;
				}
			
				/* move planets out */
				let overlap = (planet.radius + planet2.radius - dist) / 2;
				let overlapX = overlap * dx / dist;
				let overlapY = overlap * dy / dist;
				planet.x -= overlapX;
				planet.y -= overlapY;
			
			}
		}
	}
	
	/* update player by controls */
	planets[0].heading = Math.atan2(mouse.y - planets[0].y, mouse.x - planets[0].x);
	if(mouse.down) {
		planets[0].ax = Math.cos(planets[0].heading) * PLAYER_ACC;
		planets[0].ay = Math.sin(planets[0].heading) * PLAYER_ACC;
	} else {
		planets[0].ax = 0;
		planets[0].ay = 0;
	}
	
};

let draw = function() {

	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	/* draw everything faded if in death screen */
	if(game.state == GAME_STATE.DEAD) ctx.globalAlpha = 0.5;
	
	for(let i = 0; i < planets.length; i++) {
		let planet = planets[i];
		
		ctx.beginPath();
		ctx.arc(planet.x, planet.y, planet.radius, 0, 2 * Math.PI);
		ctx.closePath();	

		/* 0 is player */
		if(i == 0) ctx.fillStyle = "#ff0000";
		else ctx.fillStyle = "#ffffff";
		ctx.fill();
		
		/* if player draw heading marker */
		if(i == 0) {
			ctx.beginPath();
			ctx.moveTo(planet.x, planet.y);
			ctx.lineTo(planet.x + Math.cos(planet.heading) * 24, planet.y + Math.sin(planet.heading) * 24);
			ctx.strokeStyle = "red";
			ctx.lineWidth = 7;
			ctx.stroke();
		}
	}
	
	if(game.state == GAME_STATE.RUNNING) {
		ctx.font = "24px Consolas";
		ctx.fillStyle = "#00ff00";
		ctx.fillText(toTimeStr(game.ticks), 10, 24);
	} else if(game.state == GAME_STATE.DEAD) {
	
		/* draw death text */
		ctx.globalAlpha = 1.0;
		ctx.font = "50px Consolas";
		ctx.fillStyle = "#ffff00";
		ctx.textAlign = "center";
		
		ctx.fillText("YOU DIED", canvas.width / 2, canvas.height / 2); 
		
		if(game.ticks >= game.highTicks) {
			ctx.font = "24px Consolas";
			game.highTicks = game.ticks;
			
			ctx.fillStyle = "#ff1493";
			ctx.fillText("New high score!", canvas.width / 2, canvas.height / 2 + 30);
		}
	
		ctx.font = "24px Consolas";
		ctx.fillText("High score: " + toTimeStr(game.highTicks), canvas.width / 2, canvas.height / 2 + 50);
		ctx.fillText("Just now: " + toTimeStr(game.ticks), canvas.width / 2, canvas.height / 2 + 70);
		
		ctx.fillText("Press any key to continue.", canvas.width / 2, canvas.height - 20);
		
		ctx.textAlign = "left";	
	}
	
};

let run = function() {
	draw();
	
	if(game.state == GAME_STATE.RUNNING) {
		step();
		game.ticks++;
	}
	
	requestAnimationFrame(run);
};

generatePlanets();
run();

window.addEventListener("mousemove", function(event) {
	let box = canvas.getBoundingClientRect();
	mouse.x = event.clientX - box.left;
	mouse.y = event.clientY - box.top;
});

window.addEventListener("keydown", function(event) {
	if(game.state == GAME_STATE.DEAD) resetGame();
});

canvas.addEventListener("mousedown", function(event) {
	mouse.down = true;
});

canvas.addEventListener("mouseup", function(event) {
	mouse.down =  false;
});
