exports.action = function(data, callback, config, SARAH){

	// Chargement des configurations
	configSonosPerso =  JSON.parse(fs.readFileSync('plugins/sonos/configSonosPerso.prop','utf8'));
	
	//Temporaire pour la rétrocompatibilité
	if ( typeof(Config) != "undefined" ) {
		configSarah = Config;
	} else if (typeof(config) != "undefined") {
		configSarah = config;
	}

	//Check si l'ip de SARAH as bien était réglée
	if (configSarah.http.ip == "127.0.0.1") {
		console.log('Fatal Error: Sarah\'s IP cannot be 127.0.0.1 to use sonos plugin');
		callback();
	}

	// Chargement des modules nécessaire
	xml2js = require('xml2js');
	request = require('request');
	eval(fs.readFileSync(__dirname + '/www/js/sonosapi.js')+'');

	// Detection de la pièce / client Sarah
	if ((data.idPiece == undefined || data.idPiece == '') && data.actionSonos != 'saveConfig') {
		data.idPiece = data.client;
		if (data.idPiece == undefined || data.idPiece == "") {
			console.log('Fatal Error: Sarah\'s client is undefined');
		}
	}
	
	if (data.actionSonos == "lookForSonos") {
			Search();
	}
	
	// Detection de l'enceinte sur laquelle vocaliser
	else if (data.actionSonos != 'saveConfig' && (data.idSonos == '' || data.idSonos == undefined)) {
		for (var idSonos in configSonosPerso.equipements[data.idPiece]) {
			if (configSonosPerso.equipements[data.idPiece][idSonos].vocalisation == 1) {
				data.idSonos = idSonos;
			}
		}
		
		//Si le client actuel n'a pas d'enceinte on parle sur la 1ère enceinte dispo
		if (data.idSonos == undefined) {
			for (var piece in configSonosPerso.equipements) {
				for (var sonos in configSonosPerso.equipements[piece]) {
					if (data.forceEnceinte == undefined) {
						data.forceEnceinte = {};
						data.forceEnceinte.ip = '';
					}
					
					if (configSonosPerso.equipements[piece][sonos].vocalisation == 1 || configSonos.exportAllVoice == 0 || configSonosPerso.equipements[piece][sonos].ip == data.forceEnceinte.ip) {
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


	if (data.idPiece != null && data.idSonos != null) {
		var lieu = configSonosPerso.equipements[data.idPiece][data.idSonos].ip;
		var mac = configSonosPerso.equipements[data.idPiece][data.idSonos].mac;
	}

	// Actions
	if (data.actionSonos == "play" || data.actionSonos == "playradio")	{		
		GetInfosPosition(function(infos) {
			if(data.actionSonos == "playradio") {
				RunRadio(configSonosPerso.defaultRadio, function() {
				   Play(callback(configSonosPerso.confirmActions == 1 ? {'tts': 'Je lance la radio.'} : {}));
				});
		    }
			else if (infos.tracknumber == "0") {
				SARAH.askme("Il n'y a pas de musique dans la playlist. Voulez vous que je lance une radio ?", {
				  "Oui" : 'oui',
				  "Non" : 'non'
				}, 15000, function(answer, end) {
					if (answer == 'oui') {
						RunRadio(configSonosPerso.defaultRadio, function() {
							Play(end());
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
				Play(callback(configSonosPerso.confirmActions == 1 ? {'tts': 'Je lance la musique.'} : {}));
			}
		});	
	}
	  
	else if (data.actionSonos == "pause") {
		Pause(callback(configSonosPerso.confirmActions == 1 ? {'tts': 'J\'arrête la musique.'} : {}));
	}

	else if (data.actionSonos == "next") {
		Next(callback(configSonosPerso.confirmActions == 1 ? {'tts': 'Je lance la musique suivante.'} : {}));
	}

	else if (data.actionSonos == "previous") {
		Prev(callback(configSonosPerso.confirmActions == 1 ? {'tts': 'Je lance la musique précedente.'} : {}));
	}
	
	else if (data.actionSonos == "volup") {
		volUp(callback(configSonosPerso.confirmActions == 1 ? {'tts': 'Je monte le son.'} : {}));
	}
	
	else if (data.actionSonos == "voldown")	{
		volDown(callback(configSonosPerso.confirmActions == 1 ? {'tts': 'Je baisse le son.'} : {}));
	}
	
	else if (data.actionSonos == "volswitch") {
		if(data.value == undefined || data.value == '' ) {
		    callback({'tts': "Le volume est indéfini !"});
		}
		else {
			setVolume(data.value, callback(configSonosPerso.confirmActions == 1 ? {'tts': 'J\'ai réglé le volume à '+data.value+' %.'} : {}));
		}
    }
	
	else if (data.actionSonos == "synchronise")
	{
		// A ton une destination ?
		if (data.syncTo != undefined) {
			// Oui, donc on synchronique de la pièce en cours (client) vers la piece demandée (to)
			Synchronise(data.idPiece, data.syncTo, function () {
				Play(function(){
					callback(configSonosPerso.confirmActions == 1 ? {'tts': 'J\ai éffectué la synchronisation.'} : {});
				});	
			});
		}
		else {
			// Non, donc je synchronise la piece demandée (from) vers la piece en cours (client)
			Synchronise(data.syncFrom, data.idPiece, function () {
				Play(function(){
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
			var dMidnight = new Date();
			dMidnight.setHours(0);
			dMidnight.setMinutes(0);
			dMidnight.setSeconds(0);
			dMidnight.setSeconds(0);
			
			//Si la date de fin est inférieur à la date de départ...
			if (dEndTime < dStartTime) {
				if ( dActualTime > dMidnight && dActualTime < dEndTime ) {
					dStartTime.setDate(dActualTime.getDate()-1);
				}
				else {
					dEndTime.setDate(dActualTime.getDate()+1);
				}
			}
			//else if (dActualTime < dStartTime && dEndTime > dActualTime)
			if (dActualTime > dStartTime && dActualTime < dEndTime) {
				console.log("Heure de Silence: "+data.tts);
				callback();
			}
			else {
				callBackToSonos(data.tts, lieu, callback());
			}
		}
		else {
			callBackToSonos(data.tts, lieu, callback());
		}
	}
	
	else if (data.actionSonos == "test")	{
		console.log(data.dictation);
		data.dictation = data.dictation.split(" ");
		count = data.dictation.length;
		count = count - 1;
		data.dictation = data.dictation[count]
		console.log(data.dictation);
		if (data.dictation != undefined && data.dictation != '' && data.dictation != 'écouter') {
			var SpotifyWebApi = require('spotify-web-api-node');

			var spotifyApi = new SpotifyWebApi();
			
			spotifyApi.searchArtists(data.dictation)
		    .then(function(data2) {	
				artistID = data2.artists.items[0].id;
	
				RemoveAllTracksFromQueue(function() {
					METADATA = '&lt;DIDL-Lite xmlns:dc=&quot;http://purl.org/dc/elements/1.1/&quot; xmlns:upnp=&quot;urn:schemas-upnp-org:metadata-1-0/upnp/&quot; xmlns:r=&quot;urn:schemas-rinconnetworks-com:metadata-1-0/&quot; xmlns=&quot;urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/&quot;&gt;&lt;item id=&quot;0008006ctophits%3aspotify%3aartist%3a'+artistID+'&quot; parentID=&quot;00050064spotify%3aartist%3a'+artistID+'&quot; restricted=&quot;true&quot;&gt;&lt;dc:title&gt;Pistes Populaires&lt;/dc:title&gt;&lt;upnp:class&gt;object.container&lt;/upnp:class&gt;&lt;desc id=&quot;cdudn&quot; nameSpace=&quot;urn:schemas-rinconnetworks-com:metadata-1-0/&quot;&gt;SA_RINCON2311_X_#Svc2311-0-Token&lt;/desc&gt;&lt;/item&gt;&lt;/DIDL-Lite&gt;';
					AddURIToQueue('x-rincon-cpcontainer:0008006ctophits%3aspotify%3aartist%3a'+artistID, METADATA, function () {
						Seek('TRACK_NR', 1, function() {
							Play(function(){
								callback(configSonosPerso.confirmActions == 1 ? {'tts': 'Je lance l\'artiste '+data.dictation} : {});
							});			
						});
					});
				});
		    }, function(err) {
				console.error(err);
		    });
		}
		else {
			callback({'tts': 'Je n\'ai pas compris votre requete.'});
		}
	}
	
	else if (data.actionSonos == "saveConfig") {
		data = JSON.stringify(data);

		saveFile('sonos', 'configSonosPerso.prop', data);
		
		/*generateXml(configSonosPerso);*/
		
		callback();

	}
	
	function saveFile(name, file, content) {
		if (!name || !file){ return; }
		  
		winston = require('winston');
		  
		try {
			var path = 'plugins/'+name+'/'+file;
			fs = require('fs');
			fs.writeFileSync(path, content, 'utf8');
			winston.info('Properties saved successfully');
		} catch(ex) {
			winston.log('error', 'Error while saving properties:', ex.message);
		}
	}
	
	function generateXml(configSonosPerso) {
		// On parcours la configuration pour connaitre toutes nos pièces
		var mesEquipements = '';
		for (var idSonos in configSonosPerso.equipements) {
			mesEquipements += '\t\t<item>dans le '+idSonos+'<tag>out.action.idPiece=\''+idSonos+'\'</tag></item>\n';
		}
		
		
		
		// On écrit le nouveau XML
		var fileXML = 'plugins/sonos/sonos.xml';
		var xml = fs.readFileSync(fileXML, 'utf8');
		replace = '##DEBUT CHOIX_DE_LA_PIECE## -->\n';
		replace += mesEquipements;
		replace += '\t\t<!-- ##FIN';
		var regexp = new RegExp('##DEBUT[^*]+##FIN', 'gm');
		var xml = xml.replace(regexp, replace);
		fs.writeFileSync(fileXML, xml, 'utf8');
	}
	
	data.idPiece = "";
};

exports.init = function(SARAH){
	fs = require('fs');

	request = require('request');
	xml2js = require('xml2js');
	
	configSonos =  JSON.parse(fs.readFileSync('plugins/sonos/configSonosPerso.prop','utf8'));

	console.log('info: [SONOS] Overcharge speak:'+configSonos.exportAllVoice);
	if (configSonos.exportAllVoice == 1) {
		exports.speak = function(tts, async) {
			if (tts != '') {
				
				if (Profile.beforeEngaged == undefined) {
					Profile.beforeEngaged =  0;
				}
				delta = Profile.last.engaged - Profile.beforeEngaged;
				
				if (delta > 1500 || isNaN(delta)) {
					tts = tts.replace('[name]', '');
					
					if (configSonos.exportType == 1) {
						forceEnceinte = configSonos.enceinteAlone
					} else {
						forceEnceinte = null;
					}
					
					if (configSonos.exportType == 2) {
						for (var idPiece in configSonos.equipements) {
							for (var idSonos in configSonos.equipements[idPiece]) {
								forceEnceinte = configSonos.equipements[idPiece][idSonos];

								SARAH.run('sonos',  { 'actionSonos' : 'callBackToSonos' , 'tts' : tts, 'client':SARAH.ScriptManager.lastCmd.client, 'forceEnceinte':forceEnceinte});
							}
						}
					} else {
						SARAH.run('sonos',  { 'actionSonos' : 'callBackToSonos' , 'tts' : tts, 'client':SARAH.ScriptManager.lastCmd.client, 'forceEnceinte':forceEnceinte});
					}
					
					Profile.beforeEngaged = Profile.last.engaged;					
				}	
				tts = ''; // on annule pour éviter de vocaliser sur les enceintes					
			}
			return tts;
			
		};
	 }
	
	eval(fs.readFileSync(__dirname + '/www/js/sonosapi.js')+'');
	Search();
 };
