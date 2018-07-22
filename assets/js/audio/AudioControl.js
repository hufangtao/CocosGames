// Learn cc.Class:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/class/index.html
// Learn Attribute:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/reference/attributes/index.html
// Learn life-cycle callbacks:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/life-cycle-callbacks/index.html

cc.Class({
    extends: cc.Component,

    properties: {
        voiceLevel:0
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        this._audioContext = new AudioContext();

        var self = this;
        var constraints = {audio:true,video: true};

        // 老的浏览器可能根本没有实现 mediaDevices，所以我们可以先设置一个空的对象
        if (navigator.mediaDevices === undefined) {
            navigator.mediaDevices = {};
        }

        // 一些浏览器部分支持 mediaDevices。我们不能直接给对象设置 getUserMedia
        // 因为这样可能会覆盖已有的属性。这里我们只会在没有getUserMedia属性的时候添加它。
        if (navigator.mediaDevices.getUserMedia === undefined) {
            navigator.mediaDevices.getUserMedia = function(constraints) {

                // 首先，如果有getUserMedia的话，就获得它
                var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

                // 一些浏览器根本没实现它 - 那么就返回一个error到promise的reject来保持一个统一的接口
                if (!getUserMedia) {
                    return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
                }

                // 否则，为老的navigator.getUserMedia方法包裹一个Promise
                return new Promise(function(resolve, reject) {
                    getUserMedia.call(navigator, constraints, resolve, reject);
                });
            }
        }

        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (mediaStream) {
                // Create analyser node
                var audioContext = self._audioContext;
                var inputPoint = audioContext.createGain();

                var audioInput = audioContext.createMediaStreamSource(mediaStream);
                audioInput.connect(inputPoint);

                var analyserNode = audioContext.createAnalyser();
                analyserNode.fftSize = 2048;
                inputPoint.connect(analyserNode);

                var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);
                analyserNode.getByteFrequencyData(freqByteData);

                self._freqByteData = freqByteData;
                self._analyserNode = analyserNode;
                self._audioInput = audioInput;

                self._inited = true;
            })
            .catch(function (err) {
                alert('Error getting audio');
                console.log(err.name+":"+err.message);
                self._inited = false;
            })
    },

    start () {

    },

    update (dt) {

        if (this._inited) {
            var sum = 0;
            for (var i = 0; i < this._dataArray; i++) {
                sum += this._dataArray[i];
            }
            this.voiceLevel = sum/this._dataArray.length;
            console.log(this.voiceLevel);
        }

    },
});
