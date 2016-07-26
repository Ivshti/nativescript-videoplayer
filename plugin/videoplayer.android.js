"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var videoCommon = require("./videoplayer-common");
var fs = require("file-system");
var application = require("application");
var settings = require("application-settings");
var pkg = require("~/package.json");
global.moduleMerge(videoCommon, exports);
function onVideoSourcePropertyChanged(data) {
    var video = data.object;
    if (!video.android) {
        return;
    }
    video._setNativeVideo(data.newValue ? data.newValue.android : null);
}
// register the setNativeValue callback
videoCommon.Video.videoSourceProperty.metadata.onSetNativeValue = onVideoSourcePropertyChanged;
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
var Video = (function (_super) {
    __extends(Video, _super);
    function Video() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(Video.prototype, "android", {
        get: function () {
            return this._android;
        },
        enumerable: true,
        configurable: true
    });
    Video.prototype._createUI = function () {
        var that = new WeakRef(this);
        var vlcTextute = new com.coolapps.VLCSurfaceView(this._context);
        var vlc = vlcTextute.GetLibVLC();
        var player = vlcTextute.GetMediaPlayer();
        //var mediaPlayerEventListener = new MediaPlayerEventListener(this);
        var mediaPlayerEventListener = new org.videolan.libvlc.VLCEvent.Listener("org.videolan.libvlc.MediaPlayer.Event", {
            onEvent: function (event) {
                var args = {
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
                    case 274:
                        args.eventName = videoCommon.Video.lengthChangedEvent;
                        break;
                    case 259:
                        args.eventName = videoCommon.Video.bufferingEvent;
                        break;
                    default:
                        console.log("vlc event and state", event.type, this._owner.getState());
                        return; //we don't care about the rest                                        
                }
                this._owner.notify(args);
            }
        });
        mediaPlayerEventListener._owner = this;
        player.setEventListener(mediaPlayerEventListener);
        this._android = vlcTextute;
        this._player = player;
        //var callback = new Callback(this);
        var callback = new org.videolan.libvlc.IVLCVout.Callback({
            onNewLayout: function (vout, width, height, visibleWidth, visibleHeight, sarNum, sarDen) {
                console.log("onNewLayout", width, height);
                this._owner.setSize(width, height);
            },
            onSurfacesCreated: function (vout) {
                //application.on("orientationChanged", this.orientationChanged);
            },
            onSurfacesDestroyed: function (vout) {
                //application.off("orientationChanged", this.orientationChanged);
            }
        });
        callback._owner = this;
        player.getVLCVout().addCallback(callback);
        if (this.src) {
            var isUrl = false;
            try {
                if (this.src.indexOf("://") !== -1) {
                    if (this.src.indexOf('res://') === -1) {
                        isUrl = true;
                    }
                }
            }
            catch (error) {
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
            }
            else {
                this.src = android.net.Uri.parse(this.src);
            }
            var media = new org.videolan.libvlc.Media(vlc, this.src);
            player.setMedia(media);
        }
        if (this.autoplay === true) {
            //todo a bit of an ugly fix
            setTimeout(function () {
                player.play();
            }, 100);
        }
    };
    Video.prototype._setNativeVideo = function (nativeVideo) {
        if (nativeVideo) {
            var vlc = this.android.GetLibVLC();
            var media = new org.videolan.libvlc.Media(vlc, nativeVideo);
            this._player.setMedia(media);
        }
        else {
            this.stop();
        }
    };
    Video.prototype.setNativeSource = function (nativePlayerSrc) {
        this.src = nativePlayerSrc;
    };
    Video.prototype.play = function () {
        this._player.play();
    };
    Video.prototype.pause = function () {
        this._player.pause();
    };
    Video.prototype.stop = function () {
        if (this._player) {
            this._player.stop();
        }
    };
    Video.prototype.seekTo = function (pos) {
        this._player.setPosition(pos);
    };
    Video.prototype.seekToTime = function (msec) {
        this._player.setTime(msec);
    };
    Video.prototype.getTime = function () {
        return this._player.getTime();
    };
    Video.prototype.getPosition = function () {
        return this._player.getPosition();
    };
    Video.prototype.getDuration = function () {
        return this._player.getLength();
    };
    Video.prototype.isPlaying = function () {
        return this._player.isPlaying();
    };
    Video.prototype.isBuffering = function () {
        return this.getState() == 2;
    };
    Video.prototype.getState = function () {
        return this._player.getPlayerState();
    };
    //video width and height    
    Video.prototype.setSize = function (width, height) {
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
    };
    return Video;
}(videoCommon.Video));
exports.Video = Video;
//# sourceMappingURL=videoplayer.android.js.map