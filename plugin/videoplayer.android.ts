import videoCommon = require("./videoplayer-common");
import videoSource = require("video-source");
import dependencyObservable = require("ui/core/dependency-observable");
import fs = require("file-system");
import proxy = require("ui/core/proxy");
import * as enumsModule from "ui/enums";
import view = require("ui/core/view");
import utils = require("utils/utils");
import application = require("application");
import settings = require("application-settings");
import pkg = require("~/package.json");

global.moduleMerge(videoCommon, exports);

function onVideoSourcePropertyChanged(data: dependencyObservable.PropertyChangeData) {
    var video = <Video>data.object;
    if (!video.android) {
        return;
    }

    video._setNativeVideo(data.newValue ? data.newValue.android : null);
}
// register the setNativeValue callback
(<proxy.PropertyMetadata>videoCommon.Video.videoSourceProperty.metadata).onSetNativeValue = onVideoSourcePropertyChanged;

// class MediaPlayerEventListener extends org.videolan.libvlc.MediaPlayer.EventListener {
//     private _owner: Video;

//     constructor(owner) {
//         super();
//         this._owner = owner;
//         return global.__native(this);
//     }

//     public onEvent(event) {                      
//         var args: any = {
//             object: this,
//             eventName: "",
//             value: 1
//         };

//         switch (event.type) {
//             case org.videolan.libvlc.MediaPlayer.Event.Opening:                
//                 args.eventName = videoCommon.Video.openingEvent;
//                 break;
//             case org.videolan.libvlc.MediaPlayer.Event.Playing:                   
//                 args.eventName = videoCommon.Video.playingEvent;
//                 break;
//             case org.videolan.libvlc.MediaPlayer.Event.TimeChanged:
//                 args.eventName = videoCommon.Video.timeChangedEvent;
//                 args.value = event.getTimeChanged();
//                 break;
//             // case org.videolan.libvlc.MediaPlayer.Event.PositionChanged:
//             //     console.log("PositionChanged " + event.getPositionChanged());
//             //     break;                                
//             case org.videolan.libvlc.MediaPlayer.Event.EncounteredError:                
//                 args.eventName = videoCommon.Video.errorEvent;                
//                 break;
//             case org.videolan.libvlc.MediaPlayer.Event.EndReached:                
//                 args.eventName = videoCommon.Video.finishedEvent;                
//                 break;
//             case 274: //length changed                
//                 args.eventName = videoCommon.Video.lengthChangedEvent;                
//                 break;
//             default:    
//                // console.log(event.type + " : " + this._owner.getState());                
//                 return; //we don't care about the rest

//             // case Event.Stopped:            
//             // case Event.Paused:
//             // case Event.Vout:                
//             // case Event.ESAdded:
//             // case Event.ESDeleted:
//             // case Event.SeekableChanged:
//             // case Event.PausableChanged:                    

//             // public float getPositionChanged() {        
//             // public int getVoutCount() {        
//             // public int getEsChangedType() {        
//             // public boolean getPausable() {        
//             // public boolean getSeekable() {            
//         }        

//         this._owner.notify(args);
//     }		
// }

// class Callback extends org.videolan.libvlc.IVLCVout.Callback {    
//     public _owner: Video;

//     constructor(owner) {
//         super();
//         this._owner = owner;
//         return global.__native(this);
//     }

//     public onNewLayout(vout: org.videolan.libvlc.IVLCVout, width, height, visibleWidth, visibleHeight, sarNum, sarDen) {
//         this._owner.setSize(width, height);                        
//     }

//     public onSurfacesCreated(vout: org.videolan.libvlc.IVLCVout) {
//         //application.on("orientationChanged", this.orientationChanged);
//     }

//     public onSurfacesDestroyed(vout: org.videolan.libvlc.IVLCVout) {
//         //application.off("orientationChanged", this.orientationChanged);
//     }

//     // public orientationChanged() {        
//     //     this._owner.setSize(this._owner.mw, this._owner.mh);
//     // };
// }

export class Video extends videoCommon.Video {
    private _android: com.coolapps.VLCSurfaceView;
    private _player: org.videolan.libvlc.MediaPlayer;

    get android(): com.coolapps.VLCSurfaceView {
        return this._android;
    }

    public _createUI() {
        var that = new WeakRef(this);

        var vlcTextute = new com.coolapps.VLCSurfaceView(this._context);
        var vlc = vlcTextute.GetLibVLC();
        var player = vlcTextute.GetMediaPlayer();

        //var mediaPlayerEventListener = new MediaPlayerEventListener(this);
        var mediaPlayerEventListener = new org.videolan.libvlc.VLCEvent.Listener("org.videolan.libvlc.MediaPlayer.Event",
            {
                onEvent: function (event) {
                    var args: any = {
                        object: this,
                        eventName: "",
                        value: 1
                    };

                    switch (event.type) {
                        case org.videolan.libvlc.MediaPlayer.Event.Opening:
                            args.eventName = videoCommon.Video.openingEvent;
                            break;
                        case org.videolan.libvlc.MediaPlayer.Event.Playing:
                            args.eventName = videoCommon.Video.playingEvent;
                            break;
                        // case org.videolan.libvlc.MediaPlayer.Event.TimeChanged:
                        //     args.eventName = videoCommon.Video.timeChangedEvent;
                        //     args.value = event.getTimeChanged();
                        //     break;
                        case org.videolan.libvlc.MediaPlayer.Event.PositionChanged:
                            args.eventName = videoCommon.Video.timeChangedEvent;
                            args.value = event.getPositionChanged();
                            break;
                        case org.videolan.libvlc.MediaPlayer.Event.EncounteredError:
                            args.eventName = videoCommon.Video.errorEvent;
                            break;
                        case org.videolan.libvlc.MediaPlayer.Event.EndReached:
                            args.eventName = videoCommon.Video.finishedEvent;
                            break;
                        case 274: //length changed                
                            args.eventName = videoCommon.Video.lengthChangedEvent;
                            break;
                        case 259: //buffering - not triggering               
                            args.eventName = videoCommon.Video.bufferingEvent;
                            break;
                        default:
                            console.log("vlc event and state", event.type, this._owner.getState());
                            return; //we don't care about the rest                                        
                    }

                    this._owner.notify(args);
                }
            }
        );
        mediaPlayerEventListener._owner = this;

        player.setEventListener(mediaPlayerEventListener);

        this._android = vlcTextute;
        this._player = player;
        //var callback = new Callback(this);

        var callback = new org.videolan.libvlc.IVLCVout.Callback({
            onNewLayout: function (vout: org.videolan.libvlc.IVLCVout, width, height, visibleWidth, visibleHeight, sarNum, sarDen) {
                console.log("onNewLayout", width, height);
                this._owner.setSize(width, height);
            },

            onSurfacesCreated: function (vout: org.videolan.libvlc.IVLCVout) {
                //application.on("orientationChanged", this.orientationChanged);
            },

            onSurfacesDestroyed: function (vout: org.videolan.libvlc.IVLCVout) {
                //application.off("orientationChanged", this.orientationChanged);
            }
        });
        callback._owner = this;

        player.getVLCVout().addCallback(callback);

        this.setSrc();
    }

    public setSrc(): void {
        var that = this;

        if (this.src) {
            var isUrl = false;

            try {
                if (this.src.indexOf("://") !== -1) {
                    if (this.src.indexOf('res://') === -1) {
                        isUrl = true;
                    }
                }
            } catch (error) {
                //trying to catch indexOf .src failed
                error.src = this.src;
                var err = JSON.stringify({ report_id: Date.now(), err: error, version: pkg.version });
                settings.setString("uncaughtError", err);
                console.log("onUncaughtError: " + err);
            }

            if (!isUrl) {
                var currentPath = fs.knownFolders.currentApp().path;

                if (this.src[1] === '/' && (this.src[0] === '.' || this.src[0] === '~')) {
                    this.src = this.src.substr(2);
                }

                if (this.src[0] !== '/') {
                    this.src = currentPath + '/' + this.src;
                }
            } else {
                this.src = android.net.Uri.parse(this.src);
            }

            var vlc = this._android.GetLibVLC();            
            var media = new org.videolan.libvlc.Media(vlc, this.src);
            this._player.setMedia(media);
        }

        if (this.autoplay === true) {
            //todo a bit of an ugly fix
            setTimeout(function () {
                that._player.play();
            }, 100);
        }
    }

    public _setNativeVideo(nativeVideo: any) {
        if (nativeVideo) {
            var vlc = this.android.GetLibVLC();
            var media = new org.videolan.libvlc.Media(vlc, nativeVideo);
            this._player.setMedia(media);            

            // if (this.autoplay === true) {
            //     this._player.play();
            // }
        } else {
            this.stop();
        }
    }

    public setNativeSource(nativePlayerSrc: string) {
        this.src = nativePlayerSrc;
    }

    public play(): void {
        this._player.play();
    }

    public pause(): void {
        this._player.pause();
    }

    public stop(): void {
        if (this._player) {
            this._player.stop();
        }
    }

    public seekTo(pos: number): void {
        this._player.setPosition(pos);
    }

    public seekToTime(msec: number): void {
        this._player.setTime(msec);
    }

    public getTime(): number {
        return this._player.getTime();
    }

    public getPosition(): number {
        return this._player.getPosition();
    }

    public getDuration(): number {
        return this._player.getLength();
    }

    public isPlaying(): boolean {
        return this._player.isPlaying();
    }

    public isBuffering(): boolean {
        return this.getState() == 2;
    }

    public getState(): number {
        return this._player.getPlayerState();
    }

    //video width and height    
    public setSize(width, height) {
        if (width * height <= 1) {
            return;
        }

        var mVideoWidth = width;
        var mVideoHeight = height;

        // get screen size
        var activity = application.android.startActivity;
        var w = activity.getWindow().getDecorView().getWidth();
        var h = activity.getWindow().getDecorView().getHeight();
        console.log("activity size", w, h);
        // getWindow().getDecorView() doesn't always take orientation into
        // account, we have to correct the values
        var isPortrait = activity.getResources().getConfiguration().orientation == android.content.res.Configuration.ORIENTATION_PORTRAIT;
        if (w > h && isPortrait || w < h && !isPortrait) {
            var i = w;
            w = h;
            h = i;
            console.log("activity size portrait", w, h);
        }

        var videoAR = mVideoWidth / mVideoHeight;
        var screenAR = w / h;
        console.log("activity AR", videoAR, screenAR);

        if (screenAR < videoAR) {
            h = w / videoAR;
            console.log("activity AR h", h);
        }
        else {
            w = h * videoAR;
            console.log("activity AR w", w);
        }

        // force surface buffer size
        this._android.getHolder().setFixedSize(mVideoWidth, mVideoHeight);

        /* Log.i("setSize", "org.nativescript.widgets.GridLayout1 " + w + " : " + h);
        org.nativescript.widgets.CommonLayoutParams lp = (org.nativescript.widgets.CommonLayoutParam)this.getLayoutParams();
        lp.width = w;
        lp.height = h;
        this.setLayoutParams(lp);
        */

        var lp = this._android.getLayoutParams();
        lp.width = w;
        lp.height = h;
        this._android.setLayoutParams(lp);

        this._android.invalidate();
    }
}