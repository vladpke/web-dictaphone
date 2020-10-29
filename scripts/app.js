// set up basic variables for app

const recordYes = document.querySelector('.record-yes');
const recordNo = document.querySelector('.record-no');
const send = document.querySelector('.send');
const startOver = document.querySelector('.start-over');
const soundClips = document.querySelector('.sound-clips');
const canvas = document.querySelector('.visualizer');
const mainSection = document.querySelector('.main-controls');

const message = document.querySelector('.main-text');
const subMessage = document.querySelector('.sub-text');
let yesRecorded = false;
let lastRecording = false;
let isRecording = false;

recordNo.style.display = "none";
startOver.style.display = "none";
send.style.display = "none";


// visualiser setup - create web audio api context and canvas

let audioCtx;
const canvasCtx = canvas.getContext("2d");

//main block for doing the audio recording

if (navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.');

  const constraints = { audio: true };
  let chunks = [];

  let onSuccess = function(stream) {
    const mediaRecorder = new MediaRecorder(stream);

    visualize(stream);

    recordYes.onclick = function() {
      if (!isRecording) {
        isRecording = true;
        mediaRecorder.start();
        console.log(mediaRecorder.state);
        console.log("recorder started");
        recordYes.style.background = "red";
        recordYes.innerHTML = "Stop recording"

        recordNo.disabled = true;
      } else {
        stopRecording();
      }
    }

    recordNo.onclick = function() {
      if (!isRecording) {
        isRecording = true;
        yesRecorded = true;
        mediaRecorder.start();
        console.log(mediaRecorder.state);
        console.log("recorder started");
        recordNo.style.background = "red";
        recordNo.innerHTML = "Stop recording"

        recordYes.disabled = true;

        lastRecording = true;
      } else {
        stopRecording();
      }
    }

    send.onclick = function(e) {
      send.innerHTML = "Sent";
      startOver.style.display = "none";
    }

    function stopRecording() {
      isRecording = false;
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      recordYes.style.background = "";
      recordYes.style.color = "";
      recordNo.style.background = "";
      recordNo.style.color = "";

      recordNo.style.display = "block";
      recordYes.style.display = "none";

      // mediaRecorder.requestData();

      recordYes.disabled = false;
      recordNo.disabled = false;

      if (lastRecording) {
        recordNo.style.display = "none";
        canvas.style.display = "none";
        message.style.display = "none";
        subMessage.style.display = "none";
        startOver.style.display = "block";
        send.style.display = "block";
      }
    }

    startOver.onclick = function() {
      window.location.reload();
    }

    mediaRecorder.onstop = function(e) {
      console.log("data available after MediaRecorder.stop() called.");

      const yesClipName = "Yes";
      const noClipName = "No";

      const clipContainer = document.createElement('article');
      const clipLabel = document.createElement('p');
      const audio = document.createElement('audio');

      clipContainer.classList.add('clip');
      audio.setAttribute('controls', '');

      if(yesRecorded) {
        clipLabel.textContent = noClipName;
      } else {
        clipLabel.textContent = yesClipName;
      }

      clipContainer.appendChild(audio);
      clipContainer.appendChild(clipLabel);
      soundClips.appendChild(clipContainer);

      audio.controls = true;
      const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);

      // download(audioURL);

      audio.src = audioURL;
      console.log("recorder stopped");
    }

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }
  }

  let onError = function(err) {
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

} else {
   console.log('getUserMedia not supported on your browser!');
}

function download(url) {
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  a.href = url;
  a.download = "test.ogg";
  a.click();
  window.URL.revokeObjectURL(url);
}

function visualize(stream) {
  if(!audioCtx) {
    audioCtx = new AudioContext();
  }

  const source = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  //analyser.connect(audioCtx.destination);

  draw()

  function draw() {
    const WIDTH = canvas.width
    const HEIGHT = canvas.height;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    let sliceWidth = WIDTH * 1.0 / bufferLength;
    let x = 0;


    for(let i = 0; i < bufferLength; i++) {

      let v = dataArray[i] / 128.0;
      let y = v * HEIGHT/2;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();

  }
}

window.onresize = function() {
  canvas.width = mainSection.offsetWidth;
}

window.onresize();
