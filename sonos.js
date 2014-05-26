exports.action = function(data, callback, config, SARAH){

  //Verification que le fichier de config existe
  configSonosPerso =  JSON.parse(fs.readFileSync('plugins/sonos/configSonosPerso.prop','utf8'));
 
  xml2js = require('xml2js');
  request = require('request');

if (data.idPiece == '' || data.idPiece == undefined) {
	data.idPiece = data.client;
}

if (data.actionSonos != 'saveConfig') {
	lieu = eval('configSonosPerso.equipements.'+data.idPiece+'.ip');
	mac = eval('configSonosPerso.equipements.'+data.idPiece+'.mac');
}

function SetQueue(URI, callBackfn) {
	var url = '/MediaRenderer/AVTransport/Control';
	var action = 'SetAVTransportURI';
	var service = 'urn:schemas-upnp-org:service:AVTransport:1';
	var args = '<InstanceID>0</InstanceID><CurrentURI>'+URI+'</CurrentURI><CurrentURIMetaData></CurrentURIMetaData>';
	upnp_sonos(lieu,url,action,service,args, function (body) {
		if (callBackfn) {
			callBackfn();
		}
	});
}

function getVolume(callBackfn) {
	var url = '/MediaRenderer/RenderingControl/Control';
	var action  = 'GetVolume';
	var service = 'urn:schemas-upnp-org:service:RenderingControl:1';
	var args = '<InstanceID>0</InstanceID><Channel>Master</Channel>';
	upnp_sonos(lieu,url,action,service,args,function (body) {
		if (callBackfn) {
			 monregex = new RegExp('<CurrentVolume>(.*?)<\/CurrentVolume>');
			if (body != undefined) {
				var results = body.match(monregex);
				
				if (results != null) {
					volumeinit = parseInt(results[1]);
					callBackfn(volumeinit);
				}
			}
			else {
				volumeinit = 25;
				callBackfn(volumeinit);
			}
		}
	});
}

function setVolume(volume, callBackfn) {
	var url = '/MediaRenderer/RenderingControl/Control';
	var action  = 'SetVolume';
	var service = 'urn:schemas-upnp-org:service:RenderingControl:1';
	var args = '<InstanceID>0</InstanceID><Channel>Master</Channel><DesiredVolume>'+volume+'</DesiredVolume>';
	upnp_sonos(lieu,url,action,service,args,function (body) {
		if (callBackfn) {
			callBackfn(body);
		}
	});
}

function Play(callbackfn) {
	var url = '/MediaRenderer/AVTransport/Control';
	var action = 'Play';
	var service = 'urn:schemas-upnp-org:service:AVTransport:1';
	var args = '<InstanceID>0</InstanceID><Speed>1</Speed>';
	upnp_sonos(lieu,url,action,service,args, function() {
		if (callbackfn) {
			callbackfn();
		}
	});
}

function Pause(callbackfn) {
	var url = '/MediaRenderer/AVTransport/Control';
	var action = 'Pause';
	var service = 'urn:schemas-upnp-org:service:AVTransport:1';
	var args = '<InstanceID>0</InstanceID><Speed>1</Speed>';
	upnp_sonos(lieu,url,action,service,args, function() {
		if (callbackfn) {
			callbackfn();
		}
	});
}

function Stop(callbackfn) {
	var url = '/MediaRenderer/AVTransport/Control';
	var action = 'Stop';
	var service = 'urn:schemas-upnp-org:service:AVTransport:1';
	var args = '<InstanceID>0</InstanceID><Speed>1</Speed>';
	
	upnp_sonos(lieu,url,action,service,args, function() {
		if (callbackfn) {
			callbackfn();
		}
	});
}

function GetTransportStatus(callbackfn) {
	var url = '/MediaRenderer/AVTransport/Control';
	var action = 'GetTransportInfo';
	var service = 'urn:schemas-upnp-org:service:AVTransport:1';
	var args = '<InstanceID>0</InstanceID>';
	upnp_sonos(lieu,url,action,service,args, function(body) {
		if (callbackfn) {
			monregex = new RegExp('<CurrentTransportState>(.*?)<\/CurrentTransportState>');
			 var results = body.match(monregex);
			
			if (results != null) {
				result = results[1];
				callbackfn(result);
			}
		}
	});
}

function waitTheEndPlay(callBackFn) {
	GetTransportStatus(function(status){
		if (status == 'STOPPED' ) {
			callBackFn();
		}
		else {
			setTimeout(function() {
				waitTheEndPlay(callBackFn)
			}, 500);
		}
	});
}

function GetInfosPosition(callbackfn) {
	url = '/MediaRenderer/AVTransport/Control';
	action = 'GetPositionInfo';
	service = 'urn:schemas-upnp-org:service:AVTransport:1';
	args = '<InstanceID>0</InstanceID>';
	
	upnp_sonos(lieu,url,action,service,args, function(body) {
		monregex = new RegExp('<Track>(.*?)<\/Track>');
		var results = body.match(monregex);
		if (results != null) {
			data.tracknumber = results[1];
		}
		
		monregex = new RegExp('<RelTime>(.*?)<\/RelTime>');
		var results = body.match(monregex);
		if (results != null) {
			data.reltime = results[1];
		}
		
		monregex = new RegExp('<TrackURI>(.*?)<\/TrackURI>');
		var results = body.match(monregex);
		if (results != null) {
			data.trackuri = results[1];
		}
		
		
		callbackfn(data);
	});
}

function Synchronise(source, cible, callbackfn) {
	
	macCible = eval('configSonosPerso.equipements.'+cible+'.mac');
	lieu = eval('configSonosPerso.equipements.'+source+'.ip');
	
	SetQueue('x-rincon:RINCON_'+macCible+'01400', function() {
		if (callbackfn) {
			lieu = eval('configSonosPerso.equipements.'+cible+'.ip');
			callbackfn();
		}
	});
}

/**
* Seek to position xx:xx:xx or track number x
* @param string 'REL_TIME' for time position (xx:xx:xx) or 'TRACK_NR' for track in actual queue
* @param string
*/
function Seek(type,position, callbackfn) {

	if (type != '' && position != '') {
		var url = '/MediaRenderer/AVTransport/Control';
		var action = 'Seek';
		var service = 'urn:schemas-upnp-org:service:AVTransport:1';
		var args = '<InstanceID>0</InstanceID><Unit>'+type+'</Unit><Target>'+position+'</Target>';
		upnp_sonos(lieu,url,action,service,args, function(body) {
			if (callbackfn) {
				callbackfn();
			}
		});
	}
	else {
		if (callbackfn) {
			callbackfn();
		}
	}
}

function AddURIToQueue(URI,callbackfn){
	var url = '/MediaRenderer/AVTransport/Control';
	var action = 'AddURIToQueue';
	var service = 'urn:schemas-upnp-org:service:AVTransport:1';
	var args = '<InstanceID>0</InstanceID><EnqueuedURI>'+URI+'</EnqueuedURI><EnqueuedURIMetaData></EnqueuedURIMetaData><DesiredFirstTrackNumberEnqueued>0</DesiredFirstTrackNumberEnqueued><EnqueueAsNext>0</EnqueueAsNext>';
	
	upnp_sonos(lieu,url,action,service,args, function(body) {

		if (callbackfn) {
			monregex = new RegExp('<FirstTrackNumberEnqueued>(.*?)<\/FirstTrackNumberEnqueued>');
			var results = body.match(monregex);
			if (results != null) {
				tracknumber = results[1];
			}
			else {
				tracknumber = '';
			}
			
			callbackfn(tracknumber);
		}
	});
}

function RemoveTrackFromQueue(tracknumber, callbackfn)
{
	var url = '/MediaRenderer/AVTransport/Control';
	var action = 'RemoveTrackFromQueue';
	var service = 'urn:schemas-upnp-org:service:AVTransport:1';
	var args = '<InstanceID>0</InstanceID><ObjectID>Q:0/'+tracknumber+'</ObjectID>';
	upnp_sonos(lieu,url,action,service,args, function(body) {
		if (callbackfn) {	
			callbackfn();
		}
	});
}

function GoToPlaylistMode(callbackfn) {
	var url = '/MediaRenderer/AVTransport/Control';
	var action = 'SetAVTransportURI';
	var service = 'urn:schemas-upnp-org:service:AVTransport:1';
	var args = '<InstanceID>0</InstanceID><CurrentURI>x-rincon-queue:RINCON_'+mac+'01400#0</CurrentURI><CurrentURIMetaData></CurrentURIMetaData>';
	upnp_sonos(lieu,url,action,service,args, function(body) {
		if (callbackfn) {	
			callbackfn();
		}
	});
}

function RunRadio(radio, callbackfn) {
	var url = '/MediaRenderer/AVTransport/Control';
	var action = 'SetAVTransportURI';
	var service = 'urn:schemas-upnp-org:service:AVTransport:1';
	var args = '<InstanceID>0</InstanceID><CurrentURI>'+htmlEnc(radio)+'</CurrentURI><CurrentURIMetaData></CurrentURIMetaData>';
	upnp_sonos(lieu,url,action,service,args, function(body) {
		if (callbackfn) {	
			callbackfn();
		}
	});
}

function callBackToSonos(message, lieu) {
	console.log('CallBack To Sonos '+lieu+' requested : '+message);
	// on genere le tts en wav
	 var exec = require('child_process').exec,
    child;
	
	child = exec('cd plugins/sonos & ttstowav.vbs "'+message+'"',
	  function (error, stdout, stderr) {
		if (error !== null) {
		  console.log('exec error: ' + error);
		}
		else {
			getTopology(function(){
				// on récupère le volume actuel
				getVolume(function(volumeinit) {
					GetTransportStatus (function(statusbefore) {
						GetInfosPosition(function(position) {
							Stop(function () {
								setVolume(configSonosPerso.volumeAnnonce, function () {
									AddURIToQueue('http://'+config.http.ip+':'+config.http.port+'/assets/sonos/tempvoice.wav', function(tracknumbertemp) {
										monregex = new RegExp('x-file-cifs://(.*?)');
										var results = position.trackuri.match(monregex);								 
										if (results != null) {
											// C'est un mp3 ou equivalent
											Seek('TRACK_NR', tracknumbertemp, function() {							
												Play(function() {
													waitTheEndPlay(function() {
														setVolume(volumeinit, function () {
															Seek('TRACK_NR', position.tracknumber, function() {
																Seek('REL_TIME', position.reltime, function() {
																	if (statusbefore != 'STOPPED' && statusbefore != 'PAUSED_PLAYBACK') {
																		Play(function() {
																			RemoveTrackFromQueue(tracknumbertemp, function() {
																				console.log('liberation');
																				return;
																			});
																		});
																	}
																	else {
																		RemoveTrackFromQueue(tracknumbertemp, function() {
																			console.log('liberation');
																			return;
																		});
																	}
																});	
															});	
														});
													});
												});
											});
										}
										else {
											// C'est une radio, TV, ou equivalent
											GoToPlaylistMode(function(){				
												Seek('TRACK_NR', tracknumbertemp, function() {			
													Play(function() {
														waitTheEndPlay(function() {
															setVolume(volumeinit, function () {
																SetQueue(position.trackuri, function() {
																	if (statusbefore != 'STOPPED' && statusbefore != 'PAUSED_PLAYBACK') {
																		Play(function() {
																			RemoveTrackFromQueue(tracknumbertemp, function() {
																				console.log('liberation');
																				return;
																			});
																		});
																	}
																	else {
																		RemoveTrackFromQueue(tracknumbertemp, function() {
																			console.log('liberation');
																			return;
																		});
																	}
																});
															});
														});
													});
												});
											});
										}
									});
								});
							});
						});
					});
				});	
			});
		}
	});
}

	//fonction qui permet d'envoyer une requete SOAP sur un sonos		
	function upnp_sonos(lieu,SonosUrl,SonosAction,SonosService,SonosArgs, callBackUpnp) {
				
		var SoapRequest =
			'<?xml version="1.0" encoding="utf-8"?>' +
			'<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
				'<s:Body>' +
					'<u:'+SonosAction+' xmlns:u="'+SonosService+'">' +
					''+SonosArgs+'' +
					'</u:'+SonosAction+'>'+
				'</s:Body>' +
			'</s:Envelope>';
					
		request({ 
			'uri'     : 'http://'+lieu+':1400'+SonosUrl,
			'method'  : 'post',
			'headers' : { 
				'Content-type'   : 'text/xml; charset="utf-8"',
				'SOAPAction'     : ''+SonosService+'#'+SonosAction+''
			},
			'body' : SoapRequest
			}, function (err, response, body){
			
				if (err || response.statusCode != 200) {
					
					if (body != undefined) {
					
						monregex = new RegExp('<errorCode>(.*?)<\/errorCode>');
						var results = body.match(monregex);
						if (results != null) {
						
							if (results[1] == '701') {
							
								console.log('Requete initiale:'+SoapRequest+'\n\n');
								console.log('Reponse:'+body+'\n\n');
								console.log("Impossible de faire l'action demandée.", lieu);
							}
						}
					}
				}
				
				if (callBackUpnp) {
						callBackUpnp(body);
				}
			});
	}
	
	function getTopology(callbackfn) {
		request('http://' + lieu + ':1400/status/topology', function(err, res, body) {
			xml2js.parseString(body, function(err, topology) {
				
				// Construction de la regex permettant de récupérer l'ip en fonction de l'adresse mac
				monregex = new RegExp('http://(.*?):1400');
				tabMac = new Array();
			    topology.ZPSupportInfo.ZonePlayers[0].ZonePlayer.forEach(function(entry) {
					macTemp = entry['$'].uuid.substr(7,12);
					lieuTemp = entry['$'].location.match(monregex);
					lieuTemp = lieuTemp[1];
					tabMac[macTemp] = lieuTemp;

					if ('RINCON_'+mac+'01400' == entry['$'].uuid) {
						if (entry['$'].coordinator == 'false') {
							// le lieu en question n'est pas maitre, cherchons donc la source (coordinator)
							mac =  macTemp = entry['$'].group.substr(7,12);
						}
					}
				});
				lieu = tabMac[mac];		

				if (callbackfn) {
					callbackfn();
				}
			});
		});
	};
	
	function htmlEnc(s) {
		return s.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/'/g, '&#39;')
				.replace(/"/g, '&#34;');
	}

  
	if (data.actionSonos == "play")
	{
		getTopology(function(){
			GetInfosPosition(function(infos){
				if (infos.tracknumber == "0") {
					SARAH.askme("Il n'y a pas de musique dans la playlist. Voulez vous que je lance une radio ?", {
					  "Oui" : 'oui',
					  "Non" : 'non'
					}, 15000, function(answer, end){
						if (answer == 'oui') {
							RunRadio(configSonosPerso.defaultRadio, function(){
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
					Play(callback());	//{'tts': 'J\'allume la musique.'}
				}
			});
		});
		
	}
	  
	else if (data.actionSonos == "pause")
	{
		getTopology(function(){
			Pause(callback());	//{'tts': "La musique est éteinte."}
		});
	}


	else if (data.actionSonos == "next")
	{
		getTopology(function(){
			var url = '/MediaRenderer/AVTransport/Control';
			var action = 'Next';
			var service = 'urn:schemas-upnp-org:service:AVTransport:1';
			var args = '<InstanceID>0</InstanceID>';
			upnp_sonos(lieu,url,action,service,args, function () {
				callback();//{'tts': "J'ai mis la chanson suivante."}
			});
		});
	}

	else if (data.actionSonos == "previous")
	{
		getTopology(function(){
			var url = '/MediaRenderer/AVTransport/Control';
			var action  = 'Previous';
			var service = 'urn:schemas-upnp-org:service:AVTransport:1';
			var args = '<InstanceID>0</InstanceID>';
			upnp_sonos(lieu,url,action,service,args, function() {
				callback();//{'tts': "J'ai mis la chanson précédente."}
			});
		});
	}
	
	else if (data.actionSonos == "volup")
	{
		// On récupere le volume actuel
		getVolume(function (volumeinit) { 
			volume = volumeinit + 10;
			setVolume(volume, callback());//{'tts': "J'augmente le volume."}
		});
	}
	
	else if (data.actionSonos == "voldown")
	{
		// On récupere le volume actuel
		getVolume(function (volumeinit) { 
			volume = volumeinit - 10;
			setVolume(volume, callback());//{'tts': "Je réduis le volume."}
		});
	}
	
	else if (data.actionSonos == "synchronise")
	{
		// A ton une destination ?
		if (data.syncTo != undefined) {
			// Oui, donc on synchronique de la pièce en cours (client) vers la piece demandée (to)
			Synchronise(data.idPiece, data.syncTo, function () {

						Play(function(){

								callback();//{'tts':"Je synchronise"}

						});


					
			});
		}
		else {
			// Non, donc je synchronise la piece demandée (from) vers la piece en cours (client)
			Synchronise(data.syncFrom, data.idPiece, function () {

						Play(function(){

								callback();//{'tts':"Je synchronise"}

						});


					
			});
		}
	}
	
	else if (data.actionSonos == "callBackToSonos")
	{
		callBackToSonos(data.tts, lieu);
	}
	
	else if (data.actionSonos == "saveConfig")
	{
		json = JSON.stringify(data.body);
		
		saveFile('sonos', 'configSonosPerso.prop', json);
		
		callback();

	}
	
	else if (data.actionSonos == "test")
	{
		RunRadio("x-sonosapi-radio:Ivvo_gGiNo8?sid=151&amp;flags=108", function(){
			callback();
		});
		//x-sonosapi-radio:Ivvo_gGiNo8?sid=151&amp;flags=108

	}
	
	function saveFile(name, file, content){
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
	configSonos =  JSON.parse(fs.readFileSync('plugins/sonos/configSonosPerso.prop','utf8'));

	console.log('Sonos Overcharge speak:'+configSonos.exportAllVoice);
	if (configSonos.exportAllVoice == 1) {
		exports.speak = function(tts, async, SARAH){
			if (tts != '') {
				tts = tts.replace('[name]', '');
				SARAH.run('sonos',  { 'actionSonos' : 'callBackToSonos' , 'tts' : tts, 'client': SARAH.context.last.options.client, 'idPiece': SARAH.context.last.options.idPiece });
			}
			tts = '';
			return;
		}
	 }
 }