exports.action = function(data, callback, config, SARAH){

	// Chargement de la configuration
	configSonosPerso =  JSON.parse(fs.readFileSync('plugins/sonos/configSonosPerso.prop','utf8'));
	configSarah = config;
 
	// Chargement des modules necessaire
	xml2js = require('xml2js');
	request = require('request');
	SonosAPI = require('./sonosapi.js');
	
	// Detection de la pièce / client Sarah
	if (data.idPiece == '' || data.idPiece == undefined) {
		data.idPiece = data.client;
	}
		
	// Detection de l'enceinte sur laquelle vocaliser
	for (var idSonos in configSonosPerso.equipements[data.idPiece])
	{
		if (eval('configSonosPerso.equipements.'+data.idPiece+'.'+idSonos+'.vocalisation') == 1)
			data.idSonos = idSonos;
		//console.log(idSonos+" => "+eval('configSonosPerso.equipements.'+data.idPiece+'.'+idSonos+'.vocalisation'));
	}
	
	if (data.actionSonos != 'saveConfig') {
		lieu = eval('configSonosPerso.equipements.'+data.idPiece+'.'+data.idSonos+'.ip');
		mac = eval('configSonosPerso.equipements.'+data.idPiece+'.'+data.idSonos+'.mac');
	}

	// Actions
	if (data.actionSonos == "play" || data.actionSonos == "playradio")	{		
		SonosAPI.GetInfosPosition(function(infos) {
			if(data.actionSonos == "playradio") {
				SonosAPI.RunRadio(configSonosPerso.defaultRadio, function() {
				   SonosAPI.Play(callback());//{'tts': 'Je lance la radio.'}
				});
		    }
			if (infos.tracknumber == "0") {
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
				SonosAPI.Play(callback());
			}
		});	
	}
	  
	else if (data.actionSonos == "pause") {
		SonosAPI.Pause(callback());
	}


	else if (data.actionSonos == "next") {
		SonosAPI.Next(callback());
	}

	else if (data.actionSonos == "previous") {
		SonosAPI.Prev(callback());
	}
	
	else if (data.actionSonos == "volup") {
		SonosAPI.volUp(callback());
	}
	
	else if (data.actionSonos == "voldown")	{
		SonosAPI.volDown(callback());
	}
	
	else if (data.actionSonos == "volswitch") {
		if(data.value == undefined || data.value == '' ) {
		    callback({'tts': "Le volume est indéfini !"});
		}
		else {
			SonosAPI.setVolume(data.value, callback());//{'tts': "Je réduis le volume."}
		}
    }
	
	else if (data.actionSonos == "synchronise")
	{
		// A ton une destination ?
		if (data.syncTo != undefined) {
			// Oui, donc on synchronique de la pièce en cours (client) vers la piece demandée (to)
			SonosAPI.Synchronise(data.idPiece, data.syncTo, function () {
				SonosAPI.Play(function(){
					callback();
				});	
			});
		}
		else {
			// Non, donc je synchronise la piece demandée (from) vers la piece en cours (client)
			SonosAPI.Synchronise(data.syncFrom, data.idPiece, function () {
				SonosAPI.Play(function(){
					callback();
				});			
			});
		}
	}
	
	else if (data.actionSonos == "callBackToSonos")	{
		SonosAPI.callBackToSonos(data.tts, lieu);
	}
	
	else if (data.actionSonos == "saveConfig") {
		json = JSON.stringify(data.body);
		console.log(json);
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
	
}


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
		}
	 }
	
	SonosAPI.Search();
 }
