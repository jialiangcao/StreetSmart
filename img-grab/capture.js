const video = document.getElementById("video");
const delay = 100;
// delay is just how often (in ms) you want to capture images

// uncomment this if u want to test w/ index.html
const canvas = document.getElementById("canvas");
const photos = document.getElementById("photos");

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    console.error("Error accessing camera:", err);
  });

function captureFrames() {
  const ctx = canvas.getContext("2d");

  setInterval(() => {
    // Width/height must be nonzero or else theres an issue
    if (!video.videoWidth || !video.videoHeight) return;

    const img = document.createElement("img");
    img.src = canvas.toDataURL("image/jpeg", 0.7);
    // Do whatever you need with img (saved as jpeg or smth)

    // below is testing stuff (uncomment if u want to test w running index.html)
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    photos.appendChild(img);
    // store last 30 frames
    if (photos.children.length > 30) {
      photos.removeChild(photos.firstChild);
    }
  }, delay); // capture every DELAY ms
}

video.addEventListener("playing", captureFrames);
