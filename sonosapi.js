var devices = new Array();

/**
 * Permet de lancer une radio
 */
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

function htmlEnc(s) {
	return s.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/'/g, '&#39;')
			.replace(/"/g, '&#34;');
}

/**
 * Permet de définir la playlist
 * @param URI
 * @param callBackfn
 */
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

/**
 * Permet de récupérer le volume sonore courant
 * @param callBackfn
 */
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

/**
 * Permet de définir un volume sonore
 * @param volume
 * @param callBackfn
 */
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

/**
 * Permet de lancer la musique
 * @param callbackfn
 */
function Play(callbackfn) {
	getTopology(function() {
		var url = '/MediaRenderer/AVTransport/Control';
		var action = 'Play';
		var service = 'urn:schemas-upnp-org:service:AVTransport:1';
		var args = '<InstanceID>0</InstanceID><Speed>1</Speed>';
		upnp_sonos(lieu,url,action,service,args, function() {
			if (callbackfn) {
				callbackfn();
			}
		});
	});
}

/**
 * Permet de mettre en pause la musique
 * @param callbackfn
 */
function Pause(callbackfn) {
	getTopology(function() {
		var url = '/MediaRenderer/AVTransport/Control';
		var action = 'Pause';
		var service = 'urn:schemas-upnp-org:service:AVTransport:1';
		var args = '<InstanceID>0</InstanceID><Speed>1</Speed>';
		upnp_sonos(lieu,url,action,service,args, function() {
			if (callbackfn) {
				callbackfn();
			}
		});
	});
}

/**
 * Permet de couper la musique
 * @param callbackfn
 */
function Stop(callbackfn) {
	getTopology(function() {
		var url = '/MediaRenderer/AVTransport/Control';
		var action = 'Stop';
		var service = 'urn:schemas-upnp-org:service:AVTransport:1';
		var args = '<InstanceID>0</InstanceID><Speed>1</Speed>';
		
		upnp_sonos(lieu,url,action,service,args, function() {
			if (callbackfn) {
				callbackfn();
			}
		});
	});
}

/**
 * Permet de connaitre le statut d'un equipement sonos
 * @param callbackfn
 */
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

/**
 * Fonction qui permet d'attendre la lecture d'une piste
 * @param callBackFn
 */
function waitTheEndPlay(callBackFn) {
	GetTransportStatus(function(status){
		if (status == 'STOPPED' ) {
			callBackFn();
		}
		else {
			setTimeout(function() {
				waitTheEndPlay(callBackFn);
			}, 500);
		}
	});
}

/**
 * Permet de récuperer des informations sur la piste en cours de lecture
 * @param callbackfn
 */
function GetInfosPosition(callbackfn) {	
	url = '/MediaRenderer/AVTransport/Control';
	action = 'GetPositionInfo';
	service = 'urn:schemas-upnp-org:service:AVTransport:1';
	args = '<InstanceID>0</InstanceID>';
	
	upnp_sonos(lieu,url,action,service,args, function(body) {
		var data = {};
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
/**
 * Permet de récuperer des informations sur la piste en cours de lecture
 * @param callbackfn
 */
function GetMediaInfo(callbackfn) {	
	url = '/MediaRenderer/AVTransport/Control';
	action = 'GetMediaInfo';
	service = 'urn:schemas-upnp-org:service:AVTransport:1';
	args = '<InstanceID>0</InstanceID>';
	
	upnp_sonos(lieu,url,action,service,args, function(body) {
		var data = {};
		monregex = new RegExp('<CurrentURI>(.*?)<\/CurrentURI>');

		var results = body.match(monregex);
		if (results != null) {
			data.CurrentURI = results[1];
		}
		
		
		callbackfn(data);
	});
}

/**
 * Permet de synchroniser deux pièces entre elle
 * @param source
 * @param cible
 * @param callbackfn
 */
function Synchronise(source, cible, callbackfn) {
	/* Modif LBO - 29-06 - Suite aux modifs de la conf la récupération de l'IP/Mac à changé */
	var id = null;

	for (var idSonos in configSonosPerso.equipements[cible]) {
		if (configSonosPerso.equipements[cible][idSonos].name == source) {
			id = idSonos;
			console.log(id);
			break;
		}
	}
	if (id == null) {
		console.log("Enceinte introuvable");
		callbackfn();
	}
	/* End */
	else {
		macCible = configSonosPerso.equipements[cible][id].mac;
		lieu = configSonosPerso.equipements[cible][id].ip;
		
		SetQueue('x-rincon:RINCON_'+macCible+'01400', function() {
			if (callbackfn) {
				lieu = eval('configSonosPerso.equipements.'+cible+'.ip');
				callbackfn();
			}
		});
	}
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

/**
 * Permet d'ajouter un fichier (http://example.com/monfichier.mp3) a la playlist
 * @param URI
 * @param callbackfn
 */
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

/**
 * Permet de supprimer une piste dans la playlist
 * @param tracknumber
 * @param callbackfn
 */
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

/**
 * Permet de changer le mode en 'Playlist'
 * @param callbackfn
 */
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


/**
 * Permet d'envoyer un TTS sur les equipements SONOS
 * @param message
 * @param lieu
 */
function callBackToSonos(message, lieu) {
	console.log('CallBack To Sonos '+lieu+' requested : '+message);
	// on genere le tts en wav
	var exec = require('child_process').exec;
	
	child = exec('cd plugins/sonos & ttstowav.vbs "'+message.replace(/[^a-zA-Z0-9éçè@êàâû€$£ù \.,()!:;'#-_^%*]/g, "")+'"',
	  function (error, stdout, stderr) {
		if (error !== null) {
		  console.log('exec error: ' + error);
		}
		else {
			getTopology(function(){
				// on récupère le volume actuel
				getVolume(function(volumeinit) {
					GetTransportStatus (function(statusbefore) {
						GetMediaInfo(function(media) {
							GetInfosPosition(function(position) {
								Stop(function () {
									setVolume(configSonosPerso.volumeAnnonce, function () {
										RunRadio('http://'+configSarah.http.ip+':'+configSarah.http.port+'/assets/sonos/tempvoice.wav', function(tracknumbertemp) {
											monregex = new RegExp('x-file-cifs://(.*?)');
											var results = position.trackuri.match(monregex);
												// C'est un mp3 ou equivalent						
												Play(function() {
													waitTheEndPlay(function() {
														setVolume(volumeinit, function () {
															if (results != null) {
																Seek('TRACK_NR', position.tracknumber, function() {
																	Seek('REL_TIME', position.reltime, function() {
																		if (statusbefore != 'STOPPED' && statusbefore != 'PAUSED_PLAYBACK') {
																			Play(function() {
																				console.log('CallBack To Sonos ended');
																				return;
																			});
																		}
																		else {
																			console.log('CallBack To Sonos ended');
																			return;
	
																		}
																	});	
																});	
															}
															else {
																// Fix pour les stream mp3 radio
																monregex = new RegExp('x-sonosapi-stream:(.*?)');
																if (media.CurrentURI.match(monregex)) {
																	media.CurrentURI = position.trackuri;
																}
																
																RunRadio(media.CurrentURI, function() {
																	if (statusbefore != 'STOPPED' && statusbefore != 'PAUSED_PLAYBACK') {
																		Play(function() {
																			console.log('CallBack To Sonos ended');
																			return;
																		});
																	}
																	else {
																		console.log('CallBack To Sonos ended');
																		return;
																	}
																});
															}
														});
													});
												});
	
										});
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

/**
 * Permet d'envoyer une requete SOAP sur un sonos
 */
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

/**
 * Permet de travailler sur l'enceinte maitre (quand les pieces sont synchronisee)
 * @param callbackfn
 */
function getTopology(callbackfn) {
	request('http://' + lieu + ':1400/status/topology', function(err, res, body) {
		xml2js.parseString(body, function(err, topology) {
			
			// Construction de la regex permettant de récupérer l'ip en fonction de l'adresse mac
			monregex = new RegExp('http://(.*?):1400');
			tabMacCoordinator = new Array();
			tabLieuCoordinator = new Array();
			var groupe = '';

		    topology.ZPSupportInfo.ZonePlayers[0].ZonePlayer.forEach(function(entry) {
				macTemp = entry['$'].uuid.substr(7,12);
				lieuTemp = entry['$'].location.match(monregex);
				lieuTemp = lieuTemp[1];
				groupeTemp = entry['$'].group.substr(7,20);
				
				// On stock toutes les ip des maitres
				if (entry['$'].coordinator == 'true') {
					tabLieuCoordinator[groupeTemp] = lieuTemp;
					tabMacCoordinator[groupeTemp] = macTemp;
				}

				coordinator = true;	
				// Est ce l'enceinte que l'on souhaite piloter ?
				if ('RINCON_'+mac+'01400' == entry['$'].uuid) {
					if (entry['$'].coordinator == 'false') {
						// le lieu en question n'est pas maitre, on indique qu'on veut aller chercher son maitre
						groupe = groupeTemp;
						coordinator = false;	
					}
				}
			});
		    
		    // Si l'enceinte n'est pas son propre maitre, on va vercher l'ip du maitre
		    if (!coordinator) {
		    	lieu = tabLieuCoordinator[groupe];
		    	mac = tabMacCoordinator[groupe];		    	
		    	console.log('Due to topology, redirect to : '+lieu);
		    }

			if (callbackfn) {
				callbackfn();
			}
		});
	});
};

/**
 * Permet de passer a la musique suivante
 * @param callbackfn
 */
function Next(callbackfn) {
	getTopology(function() {
		var url = '/MediaRenderer/AVTransport/Control';
		var action = 'Next';
		var service = 'urn:schemas-upnp-org:service:AVTransport:1';
		var args = '<InstanceID>0</InstanceID>';
		upnp_sonos(lieu,url,action,service,args, function () {
			if (callbackfn) {
				callbackfn();
			}
		});
	});
}

/**
 * Permet de passer a la musique precedente
 * @param callbackfn
 */
function Prev(callbackfn) {
	getTopology(function(){
		var url = '/MediaRenderer/AVTransport/Control';
		var action  = 'Previous';
		var service = 'urn:schemas-upnp-org:service:AVTransport:1';
		var args = '<InstanceID>0</InstanceID>';
		upnp_sonos(lieu,url,action,service,args, function() {
			if (callbackfn) {
				callbackfn();
			}
		});
	});
}

/**
 * Permet d'augmenter le volume
 * @param callbackfn
 */
function volUp(callbackfn) {
	// On récupere le volume actuel
	getVolume(function (volumeinit) { 
		volume = parseInt(volumeinit) + parseInt(configSonosPerso.volumePalier);
		setVolume(volume, function() {
			if (callbackfn) {
				callbackfn();
			}
		});
	});
}

/**
 * Permet de baisser le volume
 * @param callbackfn
 */
function volDown(callbackfn) {
	// On récupere le volume actuel
	getVolume(function (volumeinit) { 
		volume = parseInt(volumeinit) - parseInt(configSonosPerso.volumePalier);
		setVolume(volume, function() {
			if (callbackfn) {
				callbackfn();
			}
		});
	});
}

function Search() {
	  var _this = this;
	  var dgram = require('dgram');

	  var PLAYER_SEARCH = new Buffer(['M-SEARCH * HTTP/1.1',
	  'HOST: 239.255.255.250:reservedSSDPport',
	  'MAN: ssdp:discover',
	  'MX: 1',
	  'ST: urn:schemas-upnp-org:device:ZonePlayer:1'].join('\r\n'));
	  
	  devices = []; // on vide
	   
	  this.socket = dgram.createSocket('udp4', function(buffer, rinfo) {
	    buffer = buffer.toString();
	    if(buffer.match(/.+Sonos.+/)) {
	    	device = {};
	    	
	    	monregex = new RegExp('(http://.*?device_description\.xml)');
	    	url_device = buffer.match(monregex);
	    	url_device = url_device[1];
	    	monregex = new RegExp('http://(.*?):1400');
	    	device.ip = buffer.match(monregex);
	    	device.ip = device.ip[1];

	    	request(url_device, function(err, res, body) {
	    		if (body != '' || body != undefined || body != null) {
		    		xml2js.parseString(body, function(err, body2) {
		   			
		    			device.name = body2.root.device[0].roomName.toString();
		    			
		    			monregex = new RegExp('RINCON_(.*?)01400');
		    			device.mac = body2.root.device[0].UDN.toString().match(monregex);
		    			device.mac = device.mac[1];
		    			
		    			// On boucle sur les enceintes déja connue pour ne pas ajouter la meme enceinte
		    			var insert = true;
		    			devices.forEach(function(entry) {
		    				if (entry.name == device.name) {
		    					insert = false;
		    				}
		    			});
		    			if (insert) {
		    				devices.push(device);
		    				
		    				content = JSON.stringify(devices);
		    				
			    			saveFile('sonos', 'devices.tmp', content);
		    			}
		    		});
	    		}
	    	});
	    } 
	  });
	  
	  this.socket.bind(function() {
	    _this.socket.setBroadcast(true);
	    _this.socket.send(PLAYER_SEARCH, 0, PLAYER_SEARCH.length, 1900, '239.255.255.250');
	  });
	  
	  return this;
}

function toObject(arr) {
	  var rv = {};
	  for (var i = 0; i < arr.length; ++i)
	    rv[i] = arr[i];
	  return rv;
	}

function saveFile(name, file, content) {
	if (!name || !file){ return; }
	  
	winston = require('winston');
	  
	try {
		var path = 'plugins/'+name+'/'+file;
		fs = require('fs');
		fs.writeFileSync(path, content, 'utf8');
		winston.info('[SONOS] Devices stored to exchange with webserver');
	} catch(ex) {
		winston.log('error', 'Error while saving properties:', ex.message);
	}
}

module.exports.RunRadio = RunRadio;
module.exports.Play = Play;
module.exports.Pause = Pause;
module.exports.Next = Next;
module.exports.Prev = Prev;
module.exports.Synchronise = Synchronise;
module.exports.getVolume = getVolume;
module.exports.setVolume = setVolume;
module.exports.callBackToSonos = callBackToSonos;
module.exports.getTopology = getTopology;
module.exports.GetInfosPosition = GetInfosPosition;
module.exports.volDown = volDown;
module.exports.volUp = volUp;
module.exports.Search = Search;
