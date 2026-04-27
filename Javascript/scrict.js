const video = document.getElementById('monitor');
const canvas = document.getElementById('capture-canvas');
const zoomRange = document.getElementById('zoom-range');
const videoIcon = document.getElementById('video-icon');

let currentStream = null;
let mediaRecorder = null;
let chunks = [];
let useFrontCamera = true;

// 1. カメラ起動
async function startCamera() {
    if (currentStream) currentStream.getTracks().forEach(t => t.stop());
    
    const constraints = {
        video: { facingMode: useFrontCamera ? "user" : "environment", zoom: true },
        audio: true
    };

    try {
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        
        // ズーム機能の初期化
        const track = currentStream.getVideoTracks()[0];
        const caps = track.getCapabilities();
        if (caps.zoom) {
            zoomRange.min = caps.zoom.min;
            zoomRange.max = caps.zoom.max;
            zoomRange.step = caps.zoom.step;
        }
    } catch (e) { console.error("カメラ起動失敗だみょん🌸", e); }
}

// 2. 静音写真撮影（Canvas経由）
document.getElementById('btn-camera').onclick = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const link = document.createElement('a');
    link.download = `shuroru_photo_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
};

// 3. 動画録画
document.getElementById('btn-video').onclick = () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        chunks = [];
        mediaRecorder = new MediaRecorder(currentStream);
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `shuroru_movie_${Date.now()}.webm`;
            a.click();
            videoIcon.src = "icon/off video.png";
        };
        mediaRecorder.start();
        videoIcon.src = "icon/on video.png";
    } else {
        mediaRecorder.stop();
    }
};

// 4. 切り替え・ズーム
document.getElementById('btn-reload').onclick = () => {
    useFrontCamera = !useFrontCamera;
    startCamera();
};

zoomRange.oninput = (e) => {
    const track = currentStream.getVideoTracks()[0];
    track.applyConstraints({ advanced: [{ zoom: e.target.value }] });
};

// 初期起動
startCamera();