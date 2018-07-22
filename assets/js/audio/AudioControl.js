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
        this._audioContext = new AudioContext();

        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!navigator.cancelAnimationFrame)
            navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
        if (!navigator.requestAnimationFrame)
            navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

        var self = this;
        navigator.getUserMedia(
            {
                "audio": {
                    "mandatory": {
                        "googEchoCancellation": "false",
                        "googAutoGainControl": "false",
                        "googNoiseSuppression": "false",
                        "googHighpassFilter": "false"
                    },
                    "optional": []
                },
            }, function (stream) {
                // Create analyser node
                var audioContext = self._audioContext;
                var inputPoint = audioContext.createGain();

                var audioInput = audioContext.createMediaStreamSource(stream);
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
            }, function (e) {
                alert('Error getting audio');
                console.log(e);
                self._inited = false;
            });
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
