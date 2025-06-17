const gameWidth = window.innerWidth;
const gameHeight = window.innerHeight;

let playerName = '';
let game;

function startGame() {
  const input = document.getElementById('playerNameInput');
  if (input.value.trim() !== '') {
    playerName = input.value.trim();
    document.getElementById('nameForm').style.display = 'none';
    game = new Phaser.Game(config);
  }
}

let config = {
  type: Phaser.AUTO,
  width: gameWidth,
  height: gameHeight,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update
  }
};

let bird, pipes, score = 0, scoreText, isGameOver = false;
let gameOverText, ground;
let pipeSpeed = -200;
let gapSize = 250; // Espaço maior
let difficultyLevel = 1;
let ranking = JSON.parse(localStorage.getItem('ranking')) || [];

let bgSound;
let jumpSound;

function preload() {
  this.load.image('bg', 'assets/bg.jpg');
  this.load.image('bird', 'assets/bird.png');
  this.load.image('pipe', 'assets/pipe.png');
  this.load.audio('bgSound', 'assets/hit.mp3');
  this.load.audio('jumpSound', 'assets/jump.mp3');
}

function create() {
  this.add.image(gameWidth / 2, gameHeight / 2, 'bg').setDisplaySize(gameWidth, gameHeight);

  bird = this.physics.add.sprite(gameWidth / 4, gameHeight / 2, 'bird').setScale(0.5);
  bird.setCollideWorldBounds(true);

  pipes = this.physics.add.group();

  this.time.addEvent({
    delay: 1500,
    callback: addPipeRow,
    callbackScope: this,
    loop: true
  });

  this.input.on('pointerdown', flap, this);
  this.input.keyboard.on('keydown-SPACE', flap, this);

  scoreText = this.add.text(20, 20, 'Pontuação: 0', {
    fontSize: '24px',
    fill: '#ffffff'
  });

  gameOverText = this.add.text(gameWidth / 2, gameHeight / 2, 'Game Over', {
    fontSize: '48px',
    fill: '#ff0000'
  }).setOrigin(0.5).setVisible(false);

  ground = this.add.rectangle(gameWidth / 2, gameHeight, gameWidth, 50, 0x000000, 0);
  this.physics.add.existing(ground, true);

  this.physics.add.collider(bird, pipes, hitPipe, null, this);
  this.physics.add.collider(bird, ground, hitPipe, null, this);

  bgSound = this.sound.add('bgSound', { loop: true, volume: 0.2 });
  jumpSound = this.sound.add('jumpSound', { volume: 0.7 });

  bgSound.play();
}

function update() {
  if (bird.y > gameHeight && !isGameOver) {
    hitPipe.call(this);
  }
}

function flap() {
  if (!isGameOver) {
    bird.setVelocityY(-300);
    if (jumpSound) jumpSound.play();
  }
}

function addPipeRow() {
  if (isGameOver) return;

  let gap = Phaser.Math.Between(100, gameHeight - gapSize);

  for (let y = 0; y < gameHeight; y += 60) {
    if (y < gap || y > gap + gapSize) {
      let pipe = pipes.create(gameWidth, y, 'pipe').setScale(0.1).refreshBody(); // Diminui o tamanho
      pipe.body.velocity.x = pipeSpeed;
      pipe.setImmovable(true);
      pipe.body.allowGravity = false;
    }
  }

  score++;
  scoreText.setText('Pontuação: ' + score);
  checkDifficultyIncrease();
}

function checkDifficultyIncrease() {
  if (score >= difficultyLevel * 10) {
    difficultyLevel++;
    pipeSpeed -= 30;
    gapSize -= 10;
    bird.body.gravity.y += 50;

    if (gapSize < 150) gapSize = 150;
  }
}

function hitPipe() {
  if (isGameOver) return;
  isGameOver = true;

  pipes.setVelocityX(0);
  bird.setTint(0xff0000);
  bird.setVelocityY(0);
  bird.body.allowGravity = false;
  bgSound.stop();

  gameOverText.setText('Game Over\nPontuação: ' + score);
  gameOverText.setVisible(true);

  ranking.push({ name: playerName, score: score });
  ranking.sort((a, b) => b.score - a.score);
  ranking = ranking.slice(0, 5);
  localStorage.setItem('ranking', JSON.stringify(ranking));

  let rankText = '🏆 Ranking\n';
  ranking.forEach((item, i) => {
    rankText += `${i + 1}. ${item.name} - ${item.score}\n`;
  });

  this.add.text(gameWidth / 2, gameHeight / 2 + 100, rankText, {
    fontSize: '24px',
    fill: '#ffffff',
    align: 'center'
  }).setOrigin(0.5);

  this.time.delayedCall(4000, () => {
    score = 0;
    isGameOver = false;
    pipeSpeed = -200;
    gapSize = 250;
    difficultyLevel = 1;
    this.scene.restart();
  });
}
