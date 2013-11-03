var APP = APP || {};

(function(){

	APP.settings = {
		loader : document.getElementById('floatingBarsG')
	};

	// Controller
	APP.controller = {
		init: function () {
			APP.router.init();
			APP.gestureControl();
			APP.pullRefresh();
			APP.transitionSettings();		
		}
	};

	// Router
	APP.router = {
		init: function () {

			//Routes
	  		routie({
			    '/schedule': function() {
			    	APP.dataFetcher('schedule', 'https://api.leaguevine.com/v1/games/?tournament_id=19389&pool_id=19222&order_by=[start_time]&fields=[start_time%2Cteam_1%2Cteam_1_score%2Cteam_2%2Cteam_2_score%2Cid]');
				},
			    '/game/*': function() {
			    	var gameId = window.location.hash.slice(7);
			    	APP.dataFetcher('game', 'https://api.leaguevine.com/v1/game_scores/?access_token=9147aea9c2&game_id='+gameId+'&fields=%5Bteam_1%2Cteam_1_score%2Cteam_2%2Cteam_2_score%5D');
			    },
			    '/ranking': function() {
			    	APP.dataFetcher('ranking', 'https://api.leaguevine.com/v1/pools/?pool_ids=%5B19222%5D&order_by=%5B%5D&fields=%5Bstandings%5D&access_token=9147aea9c2');
			    },
			    '*': function() {
			    	APP.dataFetcher('schedule', 'https://api.leaguevine.com/v1/games/?tournament_id=19389&pool_id=19222&order_by=[start_time]&fields=[start_time%2Cteam_1%2Cteam_1_score%2Cteam_2%2Cteam_2_score%2Cid]');
				}
			});
		},

		// Changes the 'page'
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

            // Calling the transition
            APP.swipeTransition(route);
		}
	};

	// Pages
	APP.page = {
		schedule: function (data) {
		    var scheduleData = data.objects;
		    var bindScheduleData = [];

		    for(var i=0;i < scheduleData.length-1; i++){
		    	var obj = scheduleData[i];
		    	if(obj.team_1){
		    		bindScheduleData[i] = {};
		    		bindScheduleData[i].startTime = obj.start_time.slice(11,16);
		    		bindScheduleData[i].team1Name = obj.team_1.name;
		    		bindScheduleData[i].team2Name = obj.team_2.name;
		    		bindScheduleData[i].team1Score = obj.team_1_score;
		    		bindScheduleData[i].team2Score = obj.team_2_score;
		    		bindScheduleData[i].id = obj.id;

		    		// Sets the url to the game page
		    		var directives = {
					  update: {
					    href: function(params) {
					      return '#/game/'+this.id;
					    }
					  }
					};
		    	}
		    }
		    
		    Transparency.render(qwery('[data-bind=schedule]')[0], bindScheduleData, directives);
		    APP.router.change();		    
		},

		game: function (data) {

    		var bindGameData = {};
    		bindGameData.team1Name = data.objects[0].team_1.name;
    		bindGameData.team2Name = data.objects[0].team_2.name;
    		bindGameData.team1Score = data.objects[0].team_1_score;
    		bindGameData.team2Score = data.objects[0].team_2_score;
		    	
		    Transparency.render(qwery('[data-bind=game]')[0], bindGameData); 
		    APP.router.change();		    
		},

		ranking: function (data) {

			var rankingData = data.objects[0].standings;
			var bindRankingData = [];

		    for(var i=0;i < rankingData.length; i++){
		    	var obj = rankingData[i];
	    		bindRankingData[i] = {};
	    		bindRankingData[i].teamName = obj.team.name;
	    		bindRankingData[i].wins = "Wins: " + obj.wins;
	    		bindRankingData[i].losses = "Losses: " +obj.losses;
	    		bindRankingData[i].pointsScored = "Points Scored: " + obj.points_scored;
	    		bindRankingData[i].pointsAllowed = "Points Allowed: " + obj.points_allowed;
	    		bindRankingData[i].plusMinus = "Points plusminus: " + obj.plus_minus;
		    }

		    bindRankingData.sort(function(a,b){return b.wins - a.wins});
			Transparency.render(qwery('[data-bind=ranking]')[0], bindRankingData);
			APP.router.change();
		}
	}

	// Function to retreive JSON data
	APP.dataFetcher = function(page, url) {
		APP.settings.loader.style.display = 'block';
		promise.get(url, {}, {"Accept": "application/json", "Authorization": "bearer 7af3a9e7e8"}).then(function(error, text, xhr) {
		    if (error) {
		        alert('Error ' + xhr.status);
		        return;
		    }

		    var data = JSON.parse(text);

		    // Sends the data to the right page
		    switch(page) {
		    	case 'schedule':
		    		APP.page.schedule(data);
		    		break;
		    	case 'game':
		    		APP.page.game(data);
		    		break;
		    	case 'ranking':
		    		APP.page.ranking(data);
		    		break; 
		    }
		    
		   	APP.settings.loader.style.display = 'none';	
		});			
	};

	// Function to push data to the API
	APP.dataPusher = function() {
		APP.settings.loader.style.display = 'block';

		// Data to send
		var gameId = window.location.hash.slice(7);
		var team1Scorer = document.getElementById('team1Score').value;
		var team2Scorer = document.getElementById('team2Score').value;
		var isFinal = document.getElementById('finalScore').checked;
		
		// Sending the data
		promise.post('https://api.leaguevine.com/v1/game_scores/', JSON.stringify({"game_id": gameId, "team_1_score": team1Scorer, "team_2_score": team2Scorer, "is_final": isFinal}), {"Content-Type": "application/json", "Accept": "application/json", "Authorization": "bearer 82996312dc"}).then(function(error, text, xhr) {
		    if (error) {
		        alert('Error ' + xhr.status);
		        return;
		    }
		    APP.settings.loader.style.display = 'none';
		});
	};


	// Mobile gestures
	APP.gestureControl = function() {
		var gestureContainer = document.getElementById('container');
		
		// Swipe left to go to ranking or schedule page
		Hammer(gestureContainer).on("swipeleft", function() {
			var route = window.location.hash.slice(2).replace(/(\/)|[0-9]/g, '');
			if (route == 'schedule') {
				window.location.href = "#/ranking";
			}
			if (route == 'game') {
				window.location.href = "#/schedule";
			}
		});

		// Swipe right to go to schedule page
		Hammer(gestureContainer).on("swiperight", function() {
			var route = window.location.hash.slice(2).replace(/(\/)|[0-9]/g, '');
			if (route == 'ranking') {
		    	window.location.href = "#/schedule";
		    }
		});
	};

	APP.transitionSettings = function() { 
	window.pageTransition = Swipe(document.getElementById('slider'), {
			startSlide: 0,
			speed: 1000,
			auto: 0,
			continuous: true,
			disableScroll: false,
			stopPropagation: false,
			callback: function(index, elem) {},
			transitionEnd: function(index, elem) {}
		});
	}	

	// Transition for switching pages
	APP.swipeTransition = function(route) {
		switch(route) {
		    case 'schedule':
		    	pageTransition.slide(0, 1000);
		    	break;
		    case 'ranking':
		    	pageTransition.slide(1, 1000);
		    	break;
		    case 'game':
		    	pageTransition.slide(2, 1000);
		    	break; 
		}
	}

	// Function to set the score
	APP.setQuantity = function(increaseDecrease, inputId) {
		var currentQuantity = parseInt(document.getElementById(inputId).value);
		var newQuantity = currentQuantity;
		

		switch(increaseDecrease) {
			case 1: // increase quantity by 1
				if (currentQuantity < 15) {
					newQuantity++;
				}
				break;
			case 2:// decrease quantity by 1
				if (currentQuantity > 0) {
					newQuantity--;
				}
				break;
		};

		document.getElementById(inputId).value = newQuantity;
	}; 

	// Vendor PulltoRefresh function
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