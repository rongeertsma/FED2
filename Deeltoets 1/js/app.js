var APP = APP || {};

(function(){

	APP.settings = {
		loader : document.getElementById('floatingBarsG')
	};

	APP.movies = {};
	// Data
	APP.schedule = {
    };

	APP.game = {
    };

	APP.ranking = {
    };

	// Controller
	APP.controller = {
		init: function () {
			APP.router.init();
			APP.gestureControl();
			APP.pullRefresh();		
		}
	}

	// Router
	APP.router = {
		init: function () {

			//Routes
	  		routie({
			    '/schedule': function() {
			    	APP.settings.loader.style.display = 'block';
			    	APP.dataFetcher('schedule', 'https://api.leaguevine.com/v1/games/?tournament_id=19389&pool_id=19222&order_by=[start_time]&fields=[start_time%2Cteam_1%2Cteam_1_score%2Cteam_2%2Cteam_2_score%2Cid]');
				},
			    '/game/*': function() {
			    	APP.settings.loader.style.display = 'block';
			    	var test = window.location.hash.slice(7);
			    	APP.dataFetcher('game', 'https://api.leaguevine.com/v1/game_scores/?access_token=9147aea9c2&game_id='+test+'&fields=%5Bteam_1%2Cteam_1_score%2Cteam_2%2Cteam_2_score%5D');
			    },
			    '/ranking': function() {
			    	APP.settings.loader.style.display = 'block';
			    	APP.dataFetcher('ranking', 'https://api.leaguevine.com/v1/pools/?pool_ids=%5B19222%5D&order_by=%5B%5D&fields=%5Bstandings%5D&access_token=9147aea9c2');
			    },
			    '/movies': function() {
			    },
			    '*': function() {
			    	APP.settings.loader.style.display = 'block';
			    	APP.dataFetcher('schedule', 'https://api.leaguevine.com/v1/games/?tournament_id=19389&pool_id=19222&order_by=[start_time]&fields=[start_time%2Cteam_1%2Cteam_1_score%2Cteam_2%2Cteam_2_score%2Cid]');
				}
			});
		},

		change: function () {
            var route = window.location.hash.slice(2).replace(/(\/)|[0-9]/g, ''),
          		sections = qwery('section[data-route]'),
            	section = qwery('[data-route=' + route + ']')[0],  
            	navLinks = qwery('nav ol li a'),
            	navLink = qwery('nav ol li a[href=#/' + route + ']')[0];
          
            // Show active section, hide all other
            if (section) {
            	for (var i=0; i < sections.length; i++){
            		sections[i].classList.remove('active');
            	}
            	section.classList.add('active');
            }

            // Show active link
            if (navLink) {
            	for (var i=0; i < navLinks.length; i++){
            		navLinks[i].classList.remove('active');
            	}
            	navLink.classList.add('active');
            }

            // Default route
            if (!route) {
            	sections[0].classList.add('active');
            	navLinks[0].classList.add('active');
            }
		}
	};

	// Page
	APP.page = {
		schedule: function (data) {
		    var meerData = data.objects;
		    var tbodyData = [];
		    for(var i=0;i < meerData.length-1; i++){
		    	var obj = meerData[i];
		    	if(obj.team_1){
		    		tbodyData[i] = {};
		    		tbodyData[i].startTime = obj.start_time.slice(11,16);
		    		tbodyData[i].team1Name = obj.team_1.name;
		    		tbodyData[i].team2Name = obj.team_2.name;
		    		tbodyData[i].team1Score = obj.team_1_score;
		    		tbodyData[i].team2Score = obj.team_2_score;
		    		tbodyData[i].id = obj.id;

		    		directives = {

					  update: {
					    href: function(params) {
					      return '#/game/'+this.id;
					    }
					  }
					};
		    	}
		    }
		    
		    Transparency.render(qwery('[data-bind=schedule]')[0], tbodyData, directives);
		    APP.router.change();		    
		},

		game: function (data) {

		    var meerData = data.objects;
		    
    		tbodyData = {};
    		tbodyData.team1Name = data.objects[0].team_1.name;
    		tbodyData.team2Name = data.objects[0].team_2.name;
    		tbodyData.team1Score = data.objects[0].team_1_score;
    		tbodyData.team2Score = data.objects[0].team_2_score;
		    	
			APP.settings.loader.style.display = 'none';
		    Transparency.render(qwery('[data-bind=game]')[0], tbodyData); // tbody
		    APP.router.change();		    

		},

		ranking: function (data) {

			var meerData = data.objects[0].standings;
			var tbodyData = [];

		    for(var i=0;i < meerData.length; i++){
		    	var obj = meerData[i];
	    		tbodyData[i] = {};
	    		tbodyData[i].teamName = obj.team.name;
	    		tbodyData[i].wins = obj.wins;
	    		tbodyData[i].losses = obj.losses;
	    		tbodyData[i].pointsScored = obj.points_scored;
	    		tbodyData[i].pointsAllowed = obj.points_allowed;
	    		tbodyData[i].plusMinus = obj.plus_minus;
	    		//tbodyData.sort([wins]);
		    }
		    tbodyData.sort(function(a,b){return b.wins - a.wins});
	    	console.log(tbodyData[1]);
			Transparency.render(qwery('[data-bind=ranking]')[0], tbodyData);
			APP.router.change();
		}
	}

	APP.dataFetcher = function(page, url) {
		promise.get(url, {}, {"Accept": "application/json", "Authorization": "bearer 7af3a9e7e8"}).then(function(error, text, xhr) {
		    if (error) {
		        alert('Error ' + xhr.status);
		        return;
		    }

		    var data = JSON.parse(text);

		    if (page == 'schedule') {
		    	APP.page.schedule(data);
		    }
		    else if (page == 'game') {
		    	APP.page.game(data);
		   	}
		   	else {
		   		APP.page.ranking(data);
		   	}
		   	APP.settings.loader.style.display = 'none';	
		})
		
			
	}

	APP.dataPusher = function() {
		APP.settings.loader.style.display = 'block';
		gameId = window.location.hash.slice(7);
		team1Scorer = document.getElementById('team1Score').value;
		team2Scorer = document.getElementById('team2Score').value;
		isFinal = document.getElementById('finalScore').checked;
		
		promise.post('https://api.leaguevine.com/v1/game_scores/', JSON.stringify({"game_id": gameId, "team_1_score": team1Scorer, "team_2_score": team2Scorer, "is_final": isFinal}), {"Content-Type": "application/json", "Accept": "application/json", "Authorization": "bearer 82996312dc"}).then(function(error, text, xhr) {
		    if (error) {
		        alert('Error ' + xhr.status);
		        return;
		    }
		    APP.settings.loader.style.display = 'none';
		})

	};


	APP.gestureControl = function() {
		var el = document.getElementById('body');

		Hammer(el).on("swipeleft", function() {
		    window.location.href = "#/ranking";
		});
		Hammer(el).on("swiperight", function() {
		    window.location.href = "#/schedule";
		});
	}

	APP.setQuantity = function(increaseDecrease, inputId) {
		var currentQuantity = parseInt(document.getElementById(inputId).value);
		var newQuantity = currentQuantity;
		
		switch(increaseDecrease) {
			case 1: // increase quantity by 1
				newQuantity++;
			break;
			case 2:// decrease quantity by 1
				if (currentQuantity > 0) {
					newQuantity--;
				}
			break;
		}

		document.getElementById(inputId).value = newQuantity;
	} 

	APP.pullRefresh = function(){
		(function() {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
            window.cancelAnimationFrame =
                    window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                        timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
    }());
	   
	    var PullToRefresh = (function() {
	        function Main(container, slidebox, slidebox_icon, handler) {
	            var self = this;

	            this.breakpoint = 80;

	            this.container = container;
	            this.slidebox = slidebox;
	            this.slidebox_icon = slidebox_icon;
	            this.handler = handler;

	            this._slidedown_height = 0;
	            this._anim = null;
	            this._dragged_down = false;

	            this.hammertime = Hammer(this.container)
	                .on("touch dragdown release", function(ev) {
	                    self.handleHammer(ev);
	                });
	        };


	        /**
	         * Handle HammerJS callback
	         * @param ev
	         */
	        Main.prototype.handleHammer = function(ev) {
	            var self = this;

	            switch(ev.type) {
	                // reset element on start
	                case 'touch':
	                    this.hide();
	                    break;

	                // on release we check how far we dragged
	                case 'release':
	                    if(!this._dragged_down) {
	                        return;
	                    }

	                    // cancel animation
	                    cancelAnimationFrame(this._anim);

	                    // over the breakpoint, trigger the callback
	                    if(ev.gesture.deltaY >= this.breakpoint) {
	                        container_el.className = 'pullrefresh-loading';
	                        pullrefresh_icon_el.className = 'icon loading';

	                        this.setHeight(60);
	                        this.handler.call(this);
	                    }
	                    // just hide it
	                    else {
	                        pullrefresh_el.className = 'slideup';
	                        container_el.className = 'pullrefresh-slideup';

	                        this.hide();
	                    }
	                    break;

	                // when we dragdown
	                case 'dragdown':
	                    this._dragged_down = true;

	                    // if we are not at the top move down
	                    var scrollY = window.scrollY;
	                    if(scrollY > 5) {
	                        return;
	                    } else if(scrollY !== 0) {
	                        window.scrollTo(0,0);
	                    }

	                    // no requestAnimationFrame instance is running, start one
	                    if(!this._anim) {
	                        this.updateHeight();
	                    }

	                    // stop browser scrolling
	                    ev.gesture.preventDefault();

	                    // update slidedown height
	                    // it will be updated when requestAnimationFrame is called
	                    this._slidedown_height = ev.gesture.deltaY * 0.4;
	                    break;
	            }
	        };


	        /**
	         * when we set the height, we just change the container y
	         * @param   {Number}    height
	         */
	        Main.prototype.setHeight = function(height) {
	            if(Modernizr.csstransforms3d) {
	                this.container.style.transform = 'translate3d(0,'+height+'px,0) ';
	                this.container.style.oTransform = 'translate3d(0,'+height+'px,0)';
	                this.container.style.msTransform = 'translate3d(0,'+height+'px,0)';
	                this.container.style.mozTransform = 'translate3d(0,'+height+'px,0)';
	                this.container.style.webkitTransform = 'translate3d(0,'+height+'px,0) scale3d(1,1,1)';
	            }
	            else if(Modernizr.csstransforms) {
	                this.container.style.transform = 'translate(0,'+height+'px) ';
	                this.container.style.oTransform = 'translate(0,'+height+'px)';
	                this.container.style.msTransform = 'translate(0,'+height+'px)';
	                this.container.style.mozTransform = 'translate(0,'+height+'px)';
	                this.container.style.webkitTransform = 'translate(0,'+height+'px)';
	            }
	            else {
	                this.container.style.top = height+"px";
	            }
	        };


	        /**
	         * hide the pullrefresh message and reset the vars
	         */
	        Main.prototype.hide = function() {
	            container_el.className = '';
	            this._slidedown_height = 0;
	            this.setHeight(0);
	            cancelAnimationFrame(this._anim);
	            this._anim = null;
	            this._dragged_down = false;
	        };


	        /**
	         * hide the pullrefresh message and reset the vars
	         */
	        Main.prototype.slideUp = function() {
	            var self = this;
	            cancelAnimationFrame(this._anim);

	            pullrefresh_el.className = 'slideup';
	            container_el.className = 'pullrefresh-slideup';

	            this.setHeight(0);

	            setTimeout(function() {
	                self.hide();
	            }, 500);
	        };


	        /**
	         * update the height of the slidedown message
	         */
	        Main.prototype.updateHeight = function() {
	            var self = this;

	            this.setHeight(this._slidedown_height);

	            if(this._slidedown_height >= this.breakpoint){
	                this.slidebox.className = 'breakpoint';
	                this.slidebox_icon.className = 'icon arrow arrow-up';
	            }
	            else {
	                this.slidebox.className = '';
	                this.slidebox_icon.className = 'icon arrow';
	            }

	            this._anim = requestAnimationFrame(function() {
	                self.updateHeight();
	            });
	        };

	        return Main;
	    })();



	    function getEl(id) {
	        return document.getElementById(id);
	    }

	    var container_el = getEl('container');
	    var pullrefresh_el = getEl('pullrefresh');
	    var pullrefresh_icon_el = getEl('pullrefresh-icon');
	    var image_el = getEl('random-image');

	    var refresh = new PullToRefresh(container_el, pullrefresh_el, pullrefresh_icon_el);

	    // update image onrefresh
	    refresh.handler = function() {
	    	APP.settings.loader.style.display = 'block';
	        var self = this;
	        // a small timeout to demo the loading state
	        setTimeout(function() {
	            promise.get('https://api.leaguevine.com/v1/games/?tournament_id=19389&pool_id=19222&order_by=[start_time]&fields=[start_time%2Cteam_1%2Cteam_1_score%2Cteam_2%2Cteam_2_score%2Cid]', {}, {"Accept": "application/json", "Authorization": "bearer 7af3a9e7e8"}).then(function(error, text, xhr) {
		            if (error) {
		                alert('Error ' + xhr.status);
		                return;
		            }

		            var data = JSON.parse(text);

		        
		                APP.page.schedule(data);
		          
		            APP.settings.loader.style.display = 'none'; 
		            self.slideUp(); 
	            })
	                 
	        }, 0);

	    };
	}

	// When DOM loaded, initialize controller
	domready(function () {
		APP.controller.init();
	});

}());