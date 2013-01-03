/************************************************
 DUCK HUNT JS
 by Matthew Surabian - MattSurabian.com
 A first draft...
 **************************************************/

var duckhunt = {
    playfield: '#game', // jquery selector, will change to jquery object on init
    level:null,
    curWave:0,
    curLevel:0,
    duckMax: 0,
    waveEnding: false,
    liveDucks: [], // array of duck objects
    levelStats: {},
    player: new Player('1', 'Player 1'), // only a single player for now
    gameTimers: {
        waveTimer: null
    },
    gameIntervals: {
        quackID: null
    },
    init: function(){
        var _this = this;
        this.playfield = $(this.playfield);

        this.player.setWeapon(new Gun(weapons.rifle,_this.playfield));

        this.playfield.on('wave:time_up',function(e,wave){_this.endWave(wave)});
        this.playfield.on('wave:end',function(e,wave){_this.endWave(wave)});

        this.playfield.on('game:next_level',function(){_this.nextLevel()});
        this.playfield.on('game:defeat',function(){_this.defeat()});
        this.playfield.on('game:victory',function(){_this.victory()});

        this.playfield.on('duck:died',function(e,duck){_this.killDuck(duck)});

        this.playfield.on('gun:out_of_ammo',function(){_this.outOfAmmo()});
        this.playfield.on('gun:fire',function(){_this.flashScreen()});

    },
    bindInteractions: function(){
        var _this = this;
        this.playfield.on('click',function(){_this.fireGun()});
    },
    unbindInteractions: function(){
        this.playfield.off('click');
        this.liveDucks.map(function(duck){
            duck.unbindEvents();
        })
    },
    loadLevel: function(level){
        this.clearTimers();
        this.level = level;
        this.curWave = 0;
        this.levelStats = {
            levelID: this.level.id,
            totalDucks: this.level.ducks*this.level.waves,
            ducksKilled: 0,
            shotsFired: 0
        };

        this.doWave();
    },
    doWave: function(){
        var _this = this;
        clearInterval(this.gameTimers.quackID);
        this.bindInteractions();

        this.curWave++;
        if(this.curWave > this.level.waves){
            this.playfield.trigger('game:next_level');
            return;
        }

        this.player.getWeapon().setAmmo(this.level.bullets);
        this.releaseDucks();

        var _curWave = this.curWave;
        this.gameTimers.waveTimer = setTimeout(function(){
            _this.playfield.trigger('wave:time_up',_curWave)
        },(this.level.time*1000));
    },
    endWave: function(wave){
        if(this.curWave == wave && !this.waveEnding){
            var _this = this;

            clearTimeout(this.gameTimers.waveTimer);

            this.waveEnding = true;

            this.flyAway();

            setTimeout(function(){
                _this.waveEnding = false;
                _this.doWave();
            },4000);
        }
    },
    nextLevel : function(){
        var skills = (this.levelStats.ducksKilled/this.levelStats.totalDucks)*100;
        if(skills < 70){
            this.playfield.trigger('game:defeat');
            return;
        }
        this.player.pushLevelStats(this.levelStats);
        this.curLevel+=1;
        if(this.curLevel === levels.length){
            this.playfield.trigger('game:victory')
        }else{
            this.loadLevel(levels[this.curLevel]);
        }
    },
    releaseDucks : function(){
        var _this = this;

        for(var i=0;i<this.level.ducks;i++){
            var duckClass = (i%2 == 0) ? 'duckA' : 'duckB';
            this.duckMax++;
            this.liveDucks.push(new Duck(_this.duckMax.toString(),duckClass,_this.level.speed,_this.playfield).fly());
        }
    },
    killDuck: function(deadDuck){
        this.levelStats.ducksKilled++;
        this.liveDucks = _(this.liveDucks).reject(function(duck){
            return duck.id === deadDuck.id;
        });

        if(this.liveDucks.length == 0){
            this.playfield.trigger('wave:end',this.curWave);
        }
    },
    fireGun : function(){
        this.levelStats.shotsFired++;
        this.player.getWeapon().shoot();
    },
    outOfAmmo: function(){
        this.unbindInteractions();
        this.playfield.trigger('wave:end',this.curWave);
    },
    flyAway: function(){
        this.liveDucks.map(function(duck){
            duck.escape();
        })
        this.liveDucks = [];
    },
    victory: function(){
        $(".winner").css("display","block");
    },
    defeat: function(){
        $(".loser").css("display","block");
    },
    retry: function(){
        $('.messages').css('display','none');
        this.loadLevel(levels[this.curLevel]);
    },
    clearTimers: function(){
        _.map(this.gameTimers,function(timer,timerName){
            clearTimeout(timer);
        });
        _.map(this.gameIntervals,function(interval,intervalName){
            clearInterval(interval);
        });
    },
    flashScreen : function(){
        $(".theFlash").css("display","block");
        setTimeout(function(){
            $('.theFlash').css("display","none");
        },70);
    }
};