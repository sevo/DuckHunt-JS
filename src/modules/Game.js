import PIXI from 'pixi.js';
import _noop from 'lodash/utility/noop';
import levels from '../data/levels.json';
import Stage from './Stage';
import audioSpriteSheet from '../../dist/audio.json';

const sound = new Howl(audioSpriteSheet);

const BLUE_SKY_COLOR = 0x64b0ff;
const PINK_SKY_COLOR = 0xfbb4d4;
const SUCCESS_RATIO = 0.6;

const MAX_X = 800;
const MAX_Y = 600;

class Game {
  /**
   * Game Constructor
   * @param opts
   * @param {String} opts.spritesheet Path to the spritesheet file that PIXI's loader should load
   * @returns {Game}
   */
  constructor(opts) {
    this.spritesheet = opts.spritesheet;
    this.loader = PIXI.loader;
    this.renderer =  PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {
      backgroundColor: BLUE_SKY_COLOR
    });
    this.levelIndex = 0;

    this.waveEnding = false;
    this.levels = levels.normal;
    return this;
  }

  get ducksMissed() {
    return this.ducksMissedVal ? this.ducksMissedVal : 0;
  }

  set ducksMissed(val) {
    this.ducksMissedVal = val;

    if (this.stage && this.stage.hud) {

      if (!this.stage.hud.hasOwnProperty('ducksMissed')) {
        this.stage.hud.createTextureBasedCounter('ducksMissed', {
          texture: 'hud/score-live/0.png',
          spritesheet: this.spritesheet,
          location: Stage.missedDuckStatusBoxLocation()
        });
      }

      this.stage.hud.ducksMissed = val;
    }
  }

  get ducksShot() {
    return this.ducksShotVal ? this.ducksShotVal : 0;
  }

  set ducksShot(val) {
    this.ducksShotVal = val;

    if (this.stage && this.stage.hud) {

      if (!this.stage.hud.hasOwnProperty('ducksShot')) {
        this.stage.hud.createTextureBasedCounter('ducksShot', {
          texture: 'hud/score-dead/0.png',
          spritesheet: this.spritesheet,
          location: Stage.deadDuckStatusBoxLocation()
        });
      }

      this.stage.hud.ducksShot = val;
    }
  }
  /**
   * bullets - getter
   * @returns {Number}
   */
  get bullets() {
    return this.bulletVal ? this.bulletVal : 0;
  }

  /**
   * bullets - setter
   * Setter for the bullets property of the game. Also in charge of updating the HUD. In the event
   * the HUD doesn't know about displaying bullets, the property and a corresponding texture container
   * will be created in HUD.
   * @param {Number} val Number of bullets
   */
  set bullets(val) {
    this.bulletVal = val;

    if (this.stage && this.stage.hud) {

      if (!this.stage.hud.hasOwnProperty('bullets')) {
        this.stage.hud.createTextureBasedCounter('bullets', {
          texture: 'hud/bullet/0.png',
          spritesheet: this.spritesheet,
          location: Stage.bulletStatusBoxLocation()
        });
      }

      this.stage.hud.bullets = val;
    }

  }

  /**
   * score - getter
   * @returns {Number}
   */
  get score() {
    return this.scoreVal ? this.scoreVal : 0;
  }

  /**
   * score - setter
   * Setter for the score property of the game. Also in charge of updating the HUD. In the event
   * the HUD doesn't know about displaying the score, the property and a corresponding text box
   * will be created in HUD.
   * @param {Number} val Score value to set
   */
  set score(val) {
    this.scoreVal = val;

    if (this.stage && this.stage.hud) {

      if (!this.stage.hud.hasOwnProperty('score')) {
        this.stage.hud.createTextBox('score', {
          style: {
            font: '18px Arial',
            align: 'left',
            fill: 'white'
          },
          location: Stage.scoreBoxLocation(),
          anchor: {
            x: 1,
            y: 0
          }
        });
      }

      this.stage.hud.score = val;
    }

  }

  /**
   * wave - get
   * @returns {Number}
   */
  get wave() {
    return this.waveVal ? this.waveVal : 0;
  }

  /**
   * wave - set
   * Setter for the wave property of the game. Also in charge of updating the HUD. In the event
   * the HUD doesn't know about displaying the wave, the property and a corresponding text box
   * will be created in the HUD.
   * @param {Number} val
   */
  set wave(val) {
    this.waveVal = val;

    if (this.stage && this.stage.hud) {

      if (!this.stage.hud.hasOwnProperty('waveStatus')) {
        this.stage.hud.createTextBox('waveStatus', {
          style: {
            font: '18px Arial',
            align: 'left',
            fill: 'white'
          },
          location: Stage.waveStatusBoxLocation(),
          anchor: {
            x: 1,
            y: 1
          }
        });
      }

      if (!isNaN(val) && val > 0) {
        this.stage.hud.waveStatus = 'Wave ' + val + ' of ' + this.level.waves;
      }else {
        this.stage.hud.waveStatus = '';
      }
    }
  }

  /**
   * gameStatus - get
   * @returns {String}
   */
  get gameStatus () {
    return this.gameStatusVal ? this.gameStatusVal : '';
  }

  /**
   * gameStatus - set
   * @param {String} val
   */
  set gameStatus(val) {
    this.gameStatusVal = val;

    if (this.stage && this.stage.hud) {

      if (!this.stage.hud.hasOwnProperty('gameStatus')) {
        this.stage.hud.createTextBox('gameStatus', {
          style: {
            font: '40px Arial',
            align: 'left',
            fill: 'white'
          },
          location: Stage.gameStatusBoxLocation()
        });
      }

      this.stage.hud.gameStatus = val;
    }
  }

  createAim() {
    let gameTextures = PIXI.loader.resources[this.spritesheet].textures;
    let texture = gameTextures['hud/aim/0.png'];
    this.aim = new PIXI.Sprite(texture);

    this.aim.anchor.x = 0.5;
    this.aim.anchor.y = 0.5;

    // move the sprite t the center of the screen
    this.aim.position.x = 200;
    this.aim.position.y = 150;

    this.stage.addChild(this.aim);
  }

  load() {
    this.loader
      .add(this.spritesheet)
      .load(this.onLoad.bind(this));
  }

  onLoad() {
    document.body.appendChild(this.renderer.view);

    this.stage = new Stage({
      spritesheet: this.spritesheet
    });

    this.scaleToWindow();
    this.bindEvents();
    this.startLevel();
    this.createAim();
    this.animate();

  }

  bindEvents() {
    window.addEventListener('resize', this.scaleToWindow.bind(this));
  }

  scaleToWindow() {
    this.renderer.resize(window.innerWidth, window.innerHeight);
    this.stage.scaleToWindow();
  }

  startLevel() {
    this.level = this.levels[this.levelIndex];
    this.ducksShot = 0;
    this.ducksMissed = 0;
    this.wave = 0;

    this.gameStatus = this.level.title;
    this.stage.preLevelAnimation().then(() => {
      this.gameStatus = '';
      this.bindInteractions();
      this.startWave();
    });
  }

  startWave() {
    sound.play('quacking');
    this.wave += 1;
    this.waveStartTime = Date.now();
    this.bullets = this.level.bullets;
    this.ducksShotThisWave = 0;
    this.waveEnding = false;

    this.stage.addDucks(this.level.ducks, this.level.speed);
    this.bindInteractions();
  }

  endWave() {
    this.waveEnding = true;
    this.bullets = 0;
    sound.stop('quacking');
    if (this.stage.ducksAlive()) {
      this.ducksMissed += this.level.ducks - this.ducksShotThisWave;
      this.renderer.backgroundColor = PINK_SKY_COLOR;
      this.stage.flyAway().then(this.goToNextWave.bind(this));
    } else {
      this.stage.cleanUpDucks();
      this.goToNextWave();
    }
  }

  goToNextWave() {
    this.renderer.backgroundColor = BLUE_SKY_COLOR;
    if (this.level.waves === this.wave) {
      this.endLevel();
    } else {
      this.startWave();
    }
  }

  shouldWaveEnd() {
    // evaluate pre-requisites for a wave to end
    if (this.wave === 0 || this.waveEnding || this.stage.dogActive()) {
      return false;
    }

    return this.isWaveTimeUp() || (this.outOfAmmo() && this.stage.ducksAlive()) || !this.stage.ducksActive();
  }

  isWaveTimeUp() {
    return this.level ? this.waveElapsedTime() >= this.level.time : false;
  }

  waveElapsedTime() {
    return (Date.now() - this.waveStartTime) / 1000;
  }

  outOfAmmo() {
    return this.level && this.bullets === 0;
  }

  endLevel() {
    this.wave = 0;
    this.goToNextLevel();
  }

  goToNextLevel() {
    this.levelIndex++;
    if (!this.levelWon()) {
      this.loss();
    } else if (this.levelIndex < this.levels.length) {
      this.startLevel();
    } else {
      this.win();
    }
  }

  levelWon() {
    return this.ducksShot > SUCCESS_RATIO * this.level.ducks * this.level.waves;
  }

  win() {
    sound.play('champ');
    this.gameStatus = 'You Win!';
  }

  loss() {
    sound.play('loserSound');
    this.gameStatus = 'You Lose!';
  }

  handleClick(event) {
    if (!this.outOfAmmo()) {
      sound.play('gunSound');
      this.bullets -= 1;
      this.updateScore(this.stage.shotsFired({
        x: this.aim.position.x,
        y: this.aim.position.y
      }));
    }
  }

  updateScore(ducksShot) {
    this.ducksShot += ducksShot;
    this.ducksShotThisWave += ducksShot;
    this.score += ducksShot * this.level.pointsPerDuck;
  }

  bindInteractions() {
    this.stage.mousedown = this.stage.touchstart = this.handleClick.bind(this);
  }

  unbindInteractions() {
    this.stage.mousedown = this.stage.touchstart = _noop;
  }

  getGazeData() {
    let getGazePoint = function(gd_lval, gd_lx, gd_ly, gd_rval, gd_rx, gd_ry) {

      var offx = screenX;// + (window.outerWidth - window.innerWidth);
      var offy = screenY + (window.outerHeight - window.innerHeight);// + (screen.height - screen.availHeight) ;

      var lx = Math.round(screen.width * gd_lx) - offx;
      var ly = Math.round(screen.height * gd_ly) - offy;
      var rx = Math.round(screen.width * gd_rx) - offx;
      var ry = Math.round(screen.height * gd_ry) - offy;

      if (gd_lval < 2 && gd_rval < 2) {
        var cx = (lx + rx) / 2;
        var cy = (ly + ry) / 2;
        return { x: cx, y: cy };
      }
      else {
        if (gd_lval < 2) {

          return { x: lx, y: ly };
        }

        if (gd_rval < 2) {
          return { x: rx, y: ry };
        }
      }
      return null;
    };

    let getXY = function(data) {
      return getGazePoint(data.LeftValidity, data.LeftGazePoint2D.X, data.LeftGazePoint2D.Y,
          data.RightValidity, data.RightGazePoint2D.X, data.RightGazePoint2D.Y);
    };

    let handleGazeData = function(that, gazeData) {
      let JSONdata = JSON.parse(gazeData).LastData;
      let gazePosition = getXY(JSONdata);
      if (gazePosition) {
        that.aim.position.x = gazePosition.x / (window.innerWidth / MAX_X);
        that.aim.position.y = gazePosition.y / (window.innerHeight / MAX_Y);
      }

    };
    let xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = (function(that) {
      return function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {
          if (xmlhttp.status == 200) {
            handleGazeData(that, xmlhttp.responseText);
          }
          else if (xmlhttp.status == 400) {
            console.log('There was an error 400');
          }
          else {
            console.log('something else other than 200 was returned');
          }
        }
      };
    })(this);

    xmlhttp.open('GET', 'http://localhost:64238/api/Gaze/Recent', true);
    xmlhttp.send();
  }

  animate() {
    this.renderer.render(this.stage);

      if (this.shouldWaveEnd()) {
        this.unbindInteractions();
        this.endWave();
      }
    this.getGazeData();
    requestAnimationFrame(this.animate.bind(this));
  }
}

export default Game;
