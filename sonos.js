exports.action = function(data, callback, config){

  //Verification que le fichier de config existe
  configSonos = config.modules.sonos;
  if (!configSonos.description){
    console.log("Le fichier de configuration est introuvable.");
    return;
  }
  
lieu = eval('configSonos.'+data.idPiece);

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
			 var results = body.match(monregex);
			
			if (results != null) {
				volumeinit = parseInt(results[1]);
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

/**
* Seek to position xx:xx:xx or track number x
* @param string 'REL_TIME' for time position (xx:xx:xx) or 'TRACK_NR' for track in actual queue
* @param string
*/
function Seek(type,position, callbackfn) {
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
			// on récupère le volume actuel
			getVolume(function(volumeinit) {
				GetTransportStatus (function(statusbefore) {
					GetInfosPosition(function(position) {
						Pause(function () {
							setVolume(configSonos.volumeAnnonce, function () {
								AddURIToQueue('http://'+config.http.ip+':'+config.http.port+'/assets/sonos/tempvoice.wav', function(tracknumbertemp) {
									Seek('TRACK_NR', tracknumbertemp, function() {
										Play(function() {
											waitTheEndPlay(function() {
												setVolume(volumeinit, function () {
													Seek('TRACK_NR', position.tracknumber, function() {
														Seek('REL_TIME', position.reltime, function() {
															if (statusbefore != 'STOPPED' && statusbefore != 'PAUSED_PLAYBACK') {
																Play(function() {
																	RemoveTrackFromQueue(tracknumbertemp, function() {
																		callback();
																	});
																});
															}
															else {
																RemoveTrackFromQueue(tracknumbertemp, function() {
																		callback();
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
					
		var request = require('request');
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
					console.log(body);
					if (body != undefined) {
						monregex = new RegExp('<errorCode>(.*?)<\/errorCode>');
						var results = body.match(monregex);
						if (results != null) {
							if (results[1] == '701') {
								callBackToSonos("Impossible de faire l'action demandée.", lieu);
							}
						}
					}
					return;
				}
				else {
					if (callBackUpnp) {
						callBackUpnp(body);
					}
				}
			});
	}
  
	if (data.actionSonos == "play")
	{
		Play(callBackToSonos("J'allume la musique.", lieu));	
	}
	  
	else if (data.actionSonos == "pause")
	{
		Pause(callBackToSonos("La musique est éteinte.", lieu));	
	}


	else if (data.actionSonos == "next")
	{
		var url = '/MediaRenderer/AVTransport/Control';
		var action = 'Next';
		var service = 'urn:schemas-upnp-org:service:AVTransport:1';
		var args = '<InstanceID>0</InstanceID>';
		upnp_sonos(lieu,url,action,service,args, function () {
			callBackToSonos("J'ai mis la chanson suivante.", lieu);
		});
		
	}

	else if (data.actionSonos == "previous")
	{
		var url = '/MediaRenderer/AVTransport/Control';
		var action  = 'Previous';
		var service = 'urn:schemas-upnp-org:service:AVTransport:1';
		var args = '<InstanceID>0</InstanceID>';
		upnp_sonos(lieu,url,action,service,args, function() {
			callBackToSonos("J'ai mis la chanson précédente.", lieu);
		});
		
	}
	
	else if (data.actionSonos == "volup")
	{
		// On récupere le volume actuel
		getVolume(function (volumeinit) { 
			volume = volumeinit + 10;
			setVolume(volume, callBackToSonos("J'augmente le volume.", lieu));
		});
	}
	
	else if (data.actionSonos == "voldown")
	{
		// On récupere le volume actuel
		getVolume(function (volumeinit) { 
			volume = volumeinit - 10;
			setVolume(volume, callBackToSonos("Je réduis le volume.", lieu));
		});
	}
	
	else if (data.actionSonos == "test")
	{
		callBackToSonos('Ceci est un test d\'annonce', lieu);
		callback();
	}
}
    