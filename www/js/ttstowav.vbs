Const SapiFileType=18 ' Magic number, possibly voice specific (0 to 64)

'strText=Trim(InputBox("What do you want me to say?","Listen to Sapi.SpFileStream.Format.Type Quality",""))
Set oArgs=WScript.Arguments ' tableau d'arguments

strText=Trim(oArgs(0))
If NOT len(strText)>0 Then WScript.Quit
With CreateObject("Scripting.FileSystemObject")
 strFile=.BuildPath(.GetParentFolderName(WScript.ScriptFullName),"../../data/voice.wav")
 If .FileExists(strFile) Then .DeleteFile strFile
End With
With CreateObject("Sapi.SpVoice")
 Set ss=CreateObject("Sapi.SpFileStream")
 ss.Format.Type=SapiFileType
 ss.Open strFile,3,False
 Set .AudioOutputStream=ss
 .Speak strText,8
 .waituntildone(-1)
 ss.Close
 Set ss=Nothing
End With
