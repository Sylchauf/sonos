exports.action = function(data, callback, config, SARAH){

	// Chargement de la configuration
	configSonosPerso =  JSON.parse(fs.readFileSync('plugins/sonos/configSonosPerso.prop','utf8'));
	configSarah = config;
 
	// Chargement des modules necessaire
	xml2js = require('xml2js');
	request = require('request');
	SonosAPI = require('./sonosapi.js');
	
	//console.log("****"+data.client+"****");
	// Detection de la pièce / client Sarah
	if (data.idPiece == '' || data.idPiece == undefined) {
		data.idPiece = data.client;
	}
	
	if (data.actionSonos == "lookForSonos") {
			SonosAPI.Search();
	}
	
	// Detection de l'enceinte sur laquelle vocaliser
	else if (data.actionSonos != 'saveConfig' && (data.idSonos == '' || data.idSonos == undefined)) {
		for (var idSonos in configSonosPerso.equipements[data.idPiece]) {
			//console.log(idSonos+" => "+configSonosPerso.equipements[data.idPiece][idSonos].vocalisation);
			if (configSonosPerso.equipements[data.idPiece][idSonos].vocalisation == 1)
				data.idSonos = idSonos;
		}
		
		//Si le client actuel n'a pas d'enceinte on parle sur la 1ère enceinte dispo
		if (data.idSonos == undefined) {
			for (var piece in configSonosPerso.equipements) {
				for (var sonos in configSonosPerso.equipements[piece]) {
					if (eval('configSonosPerso.equipements.'+piece+'.'+sonos+'.vocalisation') == 1) {
						data.idPiece = piece;
						data.idSonos = sonos;
						break;
					}
				}
				if (data.idSonos != undefined)
					break;
			}
		}
	}
	
	//console.log("Piece => "+data.idPiece + " et Enceinte => " + data.idSonos);
	lieu = configSonosPerso.equipements[data.idPiece][data.idSonos].ip;
	mac = configSonosPerso.equipements[data.idPiece][data.idSonos].mac;
	//console.log("Lieu => "+lieu+" et mac => "+mac);
	
	// Actions
	if (data.actionSonos == "play" || data.actionSonos == "playradio")	{		
		SonosAPI.GetInfosPosition(function(infos) {
			if(data.actionSonos == "playradio") {
				SonosAPI.RunRadio(configSonosPerso.defaultRadio, function() {
				   SonosAPI.Play(callback(configSonosPerso.confirmActions == 1 ? {'tts': 'Je lance la radio.'} : {}));
				});
		    }
			else if (infos.tracknumber == "0") {
				SARAH.askme("Il n'y a pas de musique dans la playlist. Voulez vous que je lance une radio ?", {
				  "Oui" : 'oui',
				  "Non" : 'non'
				}, 15000, function(answer, end) {
					if (answer == 'oui') {
						SonosAPI.RunRadio(configSonosPerso.defaultRadio, function() {
							SonosAPI.Play(end());
						});
					}
					else {
						SARAH.speak('Très bien');
						callback(false, end());
					}
				});
				callback();
			}
			else {
				SonosAPI.Play(callback(configSonosPerso.confirmActions == 1 ? {'tts': 'Je lance la musique.'} : {}));
			}
		});	
	}
	  
	else if (data.actionSonos == "pause") {
		SonosAPI.Pause(callback(configSonosPerso.confirmActions == 1 ? {'tts': 'J\'arrête la musique.'} : {}));
	}


	else if (data.actionSonos == "next") {
		SonosAPI.Next(callback(configSonosPerso.confirmActions == 1 ? {'tts': 'Je lance la musique suivante.'} : {}));
	}

	else if (data.actionSonos == "previous") {
		SonosAPI.Prev(callback(configSonosPerso.confirmActions == 1 ? {'tts': 'Je lance la musique précedente.'} : {}));
	}
	
	else if (data.actionSonos == "volup") {
		SonosAPI.volUp(callback(configSonosPerso.confirmActions == 1 ? {'tts': 'Je monte le son.'} : {}));
	}
	
	else if (data.actionSonos == "voldown")	{
		SonosAPI.volDown(callback(configSonosPerso.confirmActions == 1 ? {'tts': 'Je baisse le son.'} : {}));
	}
	
	else if (data.actionSonos == "volswitch") {
		if(data.value == undefined || data.value == '' ) {
		    callback({'tts': "Le volume est indéfini !"});
		}
		else {
			SonosAPI.setVolume(data.value, callback(configSonosPerso.confirmActions == 1 ? {'tts': 'J\'ai réglé le volume à '+data.value+' %.'} : {}));
		}
    }
	
	else if (data.actionSonos == "synchronise")
	{
		// A ton une destination ?
		if (data.syncTo != undefined) {
			// Oui, donc on synchronique de la pièce en cours (client) vers la piece demandée (to)
			SonosAPI.Synchronise(data.idPiece, data.syncTo, function () {
				SonosAPI.Play(function(){
					callback(configSonosPerso.confirmActions == 1 ? {'tts': 'J\ai éffectué la synchronisation.'} : {});
				});	
			});
		}
		else {
			// Non, donc je synchronise la piece demandée (from) vers la piece en cours (client)
			SonosAPI.Synchronise(data.syncFrom, data.idPiece, function () {
				SonosAPI.Play(function(){
					callback(configSonosPerso.confirmActions == 1 ? {'tts': 'J\ai éffectué la synchronisation.'} : {});
				});			
			});
		}
	}
	
	else if (data.actionSonos == "callBackToSonos")	{
		/* On vérifie si SARAH à le droit de parler */
		if (configSonosPerso.Silence != null && configSonosPerso.Silence == 1
		&& configSonosPerso.silenceStart != null && configSonosPerso.silenceStart != ""
		&& configSonosPerso.silenceEnd != null && configSonosPerso.silenceEnd != "")
		{
			//Déclaration du bouzin :)
			var sStartTime = configSonosPerso.silenceStart.split(':');
			var sEndTime = configSonosPerso.silenceEnd.split(':');
			var dActualTime = new Date();
			var dStartTime = new Date();
			dStartTime.setHours(sStartTime[0]);
			dStartTime.setMinutes(sStartTime[1]);
			var dEndTime = new Date();
			dEndTime.setHours(sEndTime[0]);
			dEndTime.setMinutes(sEndTime[1]);
			if (dEndTime < dActualTime)
				dEndTime.setDate(dActualTime.getDate()+1);
			
			if (dActualTime > dStartTime && dActualTime < dEndTime) {
				console.log("Heure de Silence: "+data.tts);
			} else {
				SonosAPI.callBackToSonos(data.tts, lieu);
			}
		}
		else
			SonosAPI.callBackToSonos(data.tts, lieu);
	}
	
	else if (data.actionSonos == "saveConfig") {
		json = JSON.stringify(data.body);

		saveFile('sonos', 'configSonosPerso.prop', json);
		
		callback();

	}
	
	
	
	else if (data.actionSonos == "test") {
			SonosAPI.Search();
		//x-sonosapi-radio:Ivvo_gGiNo8?sid=151&amp;flags=108

	}
	
	function saveFile(name, file, content) {
		if (!name || !file){ return; }
		  
		winston = require('winston');
		  
		try {
			var path = 'plugins/'+name+'/'+file;
			fs = require('fs');
			fs.writeFileSync(path, content, 'utf8');
			SARAH.ConfigManager.getModule(name, true);
			winston.info('Properties saved successfully');
		} catch(ex) {
			winston.log('error', 'Error while saving properties:', ex.message);
		}
	}
	data.idPiece = "";
};


exports.init = function(SARAH){
	fs = require('fs');
	SonosAPI = require('./sonosapi.js');
	request = require('request');
	xml2js = require('xml2js');
	
	configSonos =  JSON.parse(fs.readFileSync('plugins/sonos/configSonosPerso.prop','utf8'));

	console.log('info: [SONOS] Overcharge speak:'+configSonos.exportAllVoice);
	if (configSonos.exportAllVoice == 1) {
		exports.speak = function(tts, async, SARAH) {
			if (tts != '') {
				tts = tts.replace('[name]', '');
				SARAH.run('sonos',  { 'actionSonos' : 'callBackToSonos' , 'tts' : tts, 'client': SARAH.context.last.options.client, 'idPiece': SARAH.context.last.options.idPiece });
			}
			tts = '';
			return;
		};
	 }
	
	SonosAPI.Search();
 };
