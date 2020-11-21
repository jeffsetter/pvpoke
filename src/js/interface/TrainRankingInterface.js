// JavaScript Document

var InterfaceMaster = (function () {
    var instance;

    function createInstance() {


        var object = new interfaceObject();

		function interfaceObject(){

			var self = this;
			var gm = GameMaster.getInstance();
			var data;
			var context = "train_rankings";
			var mode = "pokemon";
			var battle = new Battle();
			var csv = '';


			this.init = function(){


				if(! get){
					this.loadRankings("1500","halloween");
				} else{
					this.loadGetData();
				}

				$(".format-select").on("change", selectFormat);
				$("thead a").on("click", sortTable);
				$("body").on("click", ".check", checkBox);

				window.addEventListener('popstate', function(e) {
					get = e.state;
					self.loadGetData();
				});
			};

			// Grabs ranking data from the Game Master

			this.loadRankings = function(league, cup){
				league = parseInt(league);

				$(".train-table tbody").html('');
				$(".loading").show();

				battle.setCup(cup);
				battle.setCP(league);

				/* This timeout allows the interface to display the loading message before
				being thrown into the data loading loop */

				setTimeout(function(){
					gm.loadTrainData(self, league, cup);
				}, 50);

			}

			// Displays the grabbed data. Showoff.

			this.displayRankingData = function(rankings){

				console.log(rankings);

				data = rankings;

				$(".train-table tbody").html('');

				// Initialize csv data

				csv = 'Pokemon,Score,Type 1,Type 2,Attack,Defense,Stamina,Stat Product,Level,Fast Move,Charged Move 1,Charged Move 2\n';


				// Display top performers rankings

				for(var i = 0; i < rankings.performers.length; i++){
					var r = rankings.performers[i];

					// For now, convert species name to a species ID
					var arr = r.pokemon.split(" ");
					var movesetStr = arr[arr.length-1];
					var movesetArr = movesetStr.split(/\+|\//);
					var speciesName = r.pokemon.replace(" " + movesetStr, "");
					var speciesId = speciesName.toLowerCase();

					speciesId = speciesId.replaceAll("(","");
					speciesId = speciesId.replaceAll(")","");
					speciesId = speciesId.replaceAll(" ","_");

					var pokemon = new Pokemon(speciesId, 0, battle);

					if(! pokemon.speciesId){
						continue;
					}

					// Create a new row
					var $row = $(".train-table.performers thead tr.hide").clone();
					$row.removeClass("hide");
					$row.attr("data", speciesId);
					$row.find(".sprite-container").attr("type-1", pokemon.types[0]);
					$row.find(".sprite-container").attr("type-2", pokemon.types[0]);

					if(pokemon.types[1] != "none"){
						$row.find(".sprite-container").attr("type-2", pokemon.types[1]);
					}

					$row.find(".name").html(speciesName);
					$row.find(".moves").html(r.pokemon.split(" ")[1]);
					$row.find(".individual-score").html(r.individualScore + '%');
					$row.find(".team-score .score").html(r.teamScore);

					if(r.teamScore >= 500){
						$row.find(".team-score .score").addClass("win");
					}

					// Normalize rating so it has more visual effect
					var colorRating = 500 + ((r.teamScore - 500) * 8);

					if(colorRating > 1000){
						colorRating = 1000;
					} else if(colorRating < 0){
						colorRating = 0;
					}

					var color = battle.getRatingColor(colorRating);

					$row.find(".team-score .score").css("background-color", "rgb("+color[0]+","+color[1]+","+color[2]+")");
					$row.find(".usage").html(r.games);
					$row.find(".link a").attr("href", host+"rankings/" + battle.getCup().name + "/" + battle.getCP() + "/overall/" + pokemon.speciesId + "/");

					$(".train-table.performers tbody").append($row);
				}

				// Display top teams rankings

				for(var i = 0; i < rankings.teams.length; i++){
					var r = rankings.teams[i];
					var team = [];
					var arr = r.team.split("|"); // Split string value into Pokemon

					// Create a new row
					var $row = $(".train-table.teams thead tr.hide").clone();
					$row.removeClass("hide");

					for(var n = 0; n < arr.length; n++){
						var speciesId = arr[n].split(" ")[0];
						var movesetStr = arr[n].split(" ")[1];

						var pokemon = new Pokemon(speciesId, 0, battle);

						if(! pokemon.speciesId){
							continue;
						}

						$row.find(".sprite-container").eq(n).attr("type-1", pokemon.types[0]);
						$row.find(".sprite-container").eq(n).attr("type-2", pokemon.types[0]);
						$row.find(".sprite-container").eq(n).attr("data", speciesId);

						if(pokemon.types[1] != "none"){
							$row.find(".sprite-container").eq(n).attr("type-2", pokemon.types[1]);
						}

						$row.find(".name").eq(n).html(pokemon.speciesName);
						$row.find(".moves").eq(n).html(movesetStr);

						team.push(pokemon);
					}

					$row.find(".team-score .score").html(r.teamScore);

					if(r.teamScore >= 500){
						$row.find(".team-score .score").addClass("win");
					}

					// Normalize rating so it has more visual effect
					var colorRating = 500 + ((r.teamScore - 500) * 8);

					if(colorRating > 1000){
						colorRating = 1000;
					} else if(colorRating < 0){
						colorRating = 0;
					}

					var color = battle.getRatingColor(colorRating);

					$row.find(".team-score .score").css("background-color", "rgb("+color[0]+","+color[1]+","+color[2]+")");
					$row.find(".usage").html(r.games);

					$(".train-table.teams tbody").append($row);
				}

				$(".loading").hide();

				// Update download link with new data
				var filename = $(".cup-select option:selected").html() + " Rankings.csv";
				var filedata = '';

				if(context == "custom"){
					filename = "Custom Rankings.csv";
				}

				if (!csv.match(/^data:text\/csv/i)) {
					filedata = [csv];
					filedata = new Blob(filedata, { type: 'text/csv'});
				}

				$(".button.download-csv").attr("href", window.URL.createObjectURL(filedata));
				$(".button.download-csv").attr("download", filename);


				// If search string exists, process it

				if($(".poke-search").val() != ''){
					$(".poke-search").trigger("keyup");
				}
			}

			// Given JSON of get parameters, load these settings

			this.loadGetData = function(){

				if(! get){
					return false;
				}

				// Cycle through parameters and set them

				for(var key in get){
					if(get.hasOwnProperty(key)){

						var val = get[key];

						// Process each type of parameter

						switch(key){

							// Don't process default values so data doesn't needlessly reload

							case "cp":
								$(".league-select option[value=\""+val+"\"]").prop("selected","selected");

								break;

							case "cat":
								$(".ranking-categories a").removeClass("selected");
								$(".ranking-categories a[data=\""+val+"\"]").addClass("selected");

								// Set the corresponding scenario

								var scenarioStr = val;

								if(val == "overall"){
									scenarioStr = "leads";
								}

								for(var i = 0; i < scenarios.length; i++){
									if(scenarios[i].slug == scenarioStr){
										scenario = scenarios[i];
									}
								}
								break;

							case "cup":
								$(".cup-select option[value=\""+val+"\"]").prop("selected","selected");

								if($(".format-select option[cup=\""+val+"\"]").length > 0){
									$(".format-select option[cup=\""+val+"\"]").prop("selected","selected");
								} else{
									var cat = $(".cup-select option[value=\""+val+"\"]").attr("cat");
									$(".format-select option[value=\""+cat+"\"]").prop("selected","selected");
									selectFormat();

									$(".cup-select option[value=\""+val+"\"]").prop("selected","selected");
								}

								if(val == "grunt"){
									$(".continentals").removeClass("hide");
								} else{
									$(".continentals").addClass("hide");
								}

								battle.setCup(val);
								break;

							case "p":
								// We have to wait for the data to load before we can jump to a Pokemon, so store this for later
								jumpToPoke = val;
								break;

						}
					}
				}

				// Load data via existing change function

				var cp = $(".league-select option:selected").val();
				var category = $(".ranking-categories a.selected").attr("data");
				var cup = $(".cup-select option:selected").val();

				self.displayRankings(category, cp, cup, null);
			}

			// When the view state changes, push to browser history so it can be navigated forward or back

			this.pushHistoryState = function(cup, cp, category, speciesId){
				if(context == "custom"){
					return false;
				}

				var url = webRoot+"rankings/"+cup+"/"+cp+"/"+category+"/";

				if(speciesId){
					url += speciesId+"/";
				}

				var data = {cup: cup, cp: cp, cat: category, p: speciesId };

				window.history.pushState(data, "Rankings", url);

				// Send Google Analytics pageview

				gtag('config', UA_ID, {page_location: (host+url), page_path: url});
				gtag('event', 'Lookup', {
				  'event_category' : 'Rankings',
				  'event_label' : speciesId
				});
			}

			// Event handler for changing the league select

			function selectLeague(e){
				var cp = $(".league-select option:selected").val();

				if(context != "custom"){
					var category = $(".ranking-categories a.selected").attr("data");
					var cup = $(".cup-select option:selected").val();

					battle.setCup(cup);

					self.displayRankings(category, cp, cup);
					self.pushHistoryState(cup, cp, category, null);
				}

				battle.setCP(cp);
			}

			// Event handler for changing the cup select

			function selectCup(e){
				var cp = $(".league-select option:selected").val();
				var category = $(".ranking-categories a.selected").attr("data");
				var cup = $(".cup-select option:selected").val();

				if(! category){
					category = "overall";
				}

				if(cup == "grunt"){
					$(".continentals").removeClass("hide");
				} else{
					$(".continentals").addClass("hide");
				}

				self.displayRankings(category, cp, cup);
				self.pushHistoryState(cup, cp, category, null);
			}

			// Event handler for changing the format category

			function selectFormat(e){
				var format = $(".format-select option:selected").val();
				var cup = $(".format-select option:selected").attr("cup");

				$(".cup-select option").hide();
				$(".cup-select option[cat=\""+format+"\"]").show();

				if(cup){
					$(".cup-select option[value=\""+cup+"\"]").eq(0).prop("selected", true);
				} else{
					$(".cup-select option[cat=\""+format+"\"]").eq(0).prop("selected", true);
				}

				if((format == "all")||(cup)){
					$(".cup-select").hide();
				} else{
					$(".cup-select").show();
				}

				var cp = $(".league-select option:selected").val();
				var category = $(".ranking-categories a.selected").attr("data");
				if(! cup){
					cup = $(".cup-select option:selected").val();
				}

				battle.setCup(cup);

				self.displayRankings(category, cp, cup);
				self.pushHistoryState(cup, cp, category, null);

				if(cup == "grunt"){
					$(".continentals").removeClass("hide");
				} else{
					$(".continentals").addClass("hide");
				}

				if(format == "custom"){
					// Redirect to the custom rankings page
					window.location.href = webRoot+'custom-rankings/';
				}
			}

			// Event handler for selecting ranking category

			function sortTable(e){

				e.preventDefault();

				var $parent = $(e.target).closest("table");

				$parent.find("thead a").removeClass("selected");

				$(e.target).addClass("selected");

				var targetData = data.performers;
				var sortColumn = $(e.target).attr("data");

				if($parent.hasClass("teams")){
					targetData = data.teams;
				}

				switch(sortColumn){
					case "name":
						targetData.sort((a,b) => (a.pokemon > b.pokemon) ? 1 : ((b.pokemon > a.pokemon) ? -1 : 0));
						break;

					case "lead":
						targetData.sort((a,b) => (a.team > b.team) ? 1 : ((b.team > a.team) ? -1 : 0));
						break;

					case "individual":
						targetData.sort((a,b) => (a.individualScore > b.individualScore) ? -1 : ((b.individualScore > a.individualScore) ? 1 : 0));
						break;

					case "team":
						targetData.sort((a,b) => (a.teamScore > b.teamScore) ? -1 : ((b.teamScore > a.teamScore) ? 1 : 0));
						break;

					case "usage":
						targetData.sort((a,b) => (a.games > b.games) ? -1 : ((b.games > a.games) ? 1 : 0));
						break;
				}



				self.displayRankingData(data);
			}

			var searchTimeout;
			var searchStr = '';
			var $target = null;

			$("body").on("keyup", ".poke-search", function(e){
				searchStr = $(this).val().toLowerCase();

				$target = $(".train-table."+$(e.target).attr("target"));

				// Reset the timeout when a new key is typed. This prevents queries from being submitted too quickly and bogging things down on mobile.
				window.clearTimeout(searchTimeout);
				searchTimeout = window.setTimeout(submitSearchQuery, 200);
			});

			$("a.search-info").click(function(e){
				e.preventDefault();
				modalWindow("Search Strings", $(".sandbox-search-strings"));
			});

			function submitSearchQuery(){
				var list = GameMaster.getInstance().generatePokemonListFromSearchString(searchStr);
				console.log($target);

				if($target.hasClass("performers")){

					// Search rows of top performers
					$target.find("tbody tr").each(function(index, value){
						var id = $(this).attr("data");

						if(list.indexOf(id) > -1){
							$(this).show();
						} else{
							$(this).hide();
						}
					});

				} else if($target.hasClass("teams")){

					// Search makeups of team
					$target.find("tbody tr").each(function(index, value){
						var $row = $(this);
						var found = 0;

						$row.find(".pokemon").each(function(spriteIndex, spriteValue){
							var id = $(this).attr("data");

							if(list.indexOf(id) > -1){
								found++;
							}
						});

						if(found >= 3 || (! searchStr.includes("!")) && found > 0){
							$row.show();
						} else{
							$row.hide();
						}

					});
				}
			}

			// Turn checkboxes on and off

			function checkBox(e){
				$(this).toggleClass("on");
				$(this).trigger("stateChange");
			}
		};

        return object;
    }

    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();
