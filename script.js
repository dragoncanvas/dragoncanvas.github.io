var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var offsetX, offsetY;
var images = []; // Array to store multiple images
var draggingResizer = -1, draggingImage = -1;
var activeImage = -1;  // Track the active (selected) image
var startX, startY;

function updateCanvasOffset() {
  const rect = canvas.getBoundingClientRect();
  offsetX = rect.left;
  offsetY = rect.top;
}

function draw(withAnchors, withBorders) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  images.forEach((imgObj, index) => {
    ctx.drawImage(imgObj.img, 0, 0, imgObj.img.width, imgObj.img.height, imgObj.x, imgObj.y, imgObj.width, imgObj.height);

    if (withAnchors && activeImage === index) {
     drawDragAnchor(imgObj.x, imgObj.y, 'rgba(0, 0, 0, 0.1)'); // Top-left
      drawDragAnchor(imgObj.right, imgObj.y, 'rgba(0, 0, 0, 0.1)'); // Top-right
      drawDragAnchor(imgObj.right, imgObj.bottom, 'rgba(0, 0, 0, 1)'); // Bottom-right
      drawDragAnchor(imgObj.x, imgObj.bottom, 'rgba(0, 0, 0, 0.1)'); // Bottom-left
    }

    if (withBorders && activeImage === index) {
      ctx.beginPath();
      ctx.moveTo(imgObj.x, imgObj.y);
      ctx.lineTo(imgObj.right, imgObj.y);
      ctx.lineTo(imgObj.right, imgObj.bottom);
      ctx.lineTo(imgObj.x, imgObj.bottom);
      ctx.closePath();
      ctx.stroke();
    }
  });
}


function drawDragAnchor(x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2, false);
  ctx.closePath();
  ctx.fillStyle = color; // Use color parameter for different handles
  ctx.fill();
}


function anchorHitTest(x, y) {
  for (let i = 0; i < images.length; i++) {
    let imgObj = images[i];
    let dx, dy;

    dx = x - imgObj.x;
    dy = y - imgObj.y;
    if (dx * dx + dy * dy <= 64) return { index: i, anchor: 0 };

    dx = x - imgObj.right;
    dy = y - imgObj.y;
    if (dx * dx + dy * dy <= 64) return { index: i, anchor: 1 };

    dx = x - imgObj.right;
    dy = y - imgObj.bottom;
    if (dx * dx + dy * dy <= 64) return { index: i, anchor: 2 };

    dx = x - imgObj.x;
    dy = y - imgObj.bottom;
    if (dx * dx + dy * dy <= 64) return { index: i, anchor: 3 };
  }

  return { index: -1, anchor: -1 };
}

function hitImage(x, y) {
  for (let i = images.length - 1; i >= 0; i--) { // Reverse loop to prioritize topmost image
    let imgObj = images[i];
    if (x > imgObj.x && x < imgObj.right && y > imgObj.y && y < imgObj.bottom) {
      return i;
    }
  }
  return -1;
}

function handleMouseDown(e) {
  startX = e.clientX - offsetX;
  startY = e.clientY - offsetY;

  let hitTestResult = anchorHitTest(startX, startY);
  draggingResizer = hitTestResult.anchor;
  draggingImage = hitTestResult.index;

  if (draggingImage === -1) {
    draggingImage = hitImage(startX, startY);
  }

  if (draggingImage !== -1) {
    activeImage = draggingImage; // Set the clicked image as active
    draw(true, true);
  } else {
    activeImage = -1; // Deselect any active image if the canvas or an empty area is clicked
    draw(false, false);
  }
}

function handleMouseUp() {
  draggingResizer = -1;
  draggingImage = -1;
  if (activeImage !== -1) {
    draw(true, true); // Keep the handles visible on the active image
  } else {
    draw(false, false);
  }
}

function handleMouseMove(e) {
  if (draggingResizer > -1 && draggingImage > -1) {
    let imgObj = images[draggingImage];
    let mouseX = e.clientX - offsetX;
    let mouseY = e.clientY - offsetY;

    let aspectRatio = imgObj.img.width / imgObj.img.height; // Maintain original aspect ratio

    switch (draggingResizer) {
      case 0:
        // Resize from top-left corner
        let newWidthTL = imgObj.right - mouseX;
        let newHeightTL = imgObj.bottom - mouseY;
        imgObj.width = newWidthTL;
        imgObj.height = newHeightTL;
        if (imgObj.width / imgObj.height > aspectRatio) {
          imgObj.width = imgObj.height * aspectRatio;
        } else {
          imgObj.height = imgObj.width / aspectRatio;
        }
        imgObj.x = mouseX;
        imgObj.y = mouseY;
        break;
      case 1:
        // Resize from top-right corner
        imgObj.width = mouseX - imgObj.x;
        imgObj.height = imgObj.bottom - mouseY;
        if (imgObj.width / imgObj.height > aspectRatio) {
          imgObj.width = imgObj.height * aspectRatio;
        } else {
          imgObj.height = imgObj.width / aspectRatio;
        }
        imgObj.y = mouseY;
        break;
      case 2:
        // Resize from bottom-right corner
        imgObj.width = mouseX - imgObj.x;
        imgObj.height = mouseY - imgObj.y;
        if (imgObj.width / imgObj.height > aspectRatio) {
          imgObj.width = imgObj.height * aspectRatio;
        } else {
          imgObj.height = imgObj.width / aspectRatio;
        }
        break;
      case 3:
        // Resize from bottom-left corner
        let newWidthBL = imgObj.right - mouseX;
        let newHeightBL = mouseY - imgObj.y;
        imgObj.width = newWidthBL;
        imgObj.height = newHeightBL;
        if (imgObj.width / imgObj.height > aspectRatio) {
          imgObj.width = imgObj.height * aspectRatio;
        } else {
          imgObj.height = imgObj.width / aspectRatio;
        }
        imgObj.x = mouseX;
        break;
    }

    // Ensure dimensions are at least 25x25
    if (imgObj.width < 25) imgObj.width = 25;
    if (imgObj.height < 25) imgObj.height = 25;

    imgObj.right = imgObj.x + imgObj.width;
    imgObj.bottom = imgObj.y + imgObj.height;

    draw(true, true);

  } else if (draggingImage > -1) {
    let imgObj = images[draggingImage];
    let mouseX = e.clientX - offsetX;
    let mouseY = e.clientY - offsetY;

    let dx = mouseX - startX;
    let dy = mouseY - startY;
    imgObj.x += dx;
    imgObj.y += dy;
    imgObj.right += dx;
    imgObj.bottom += dy;
    startX = mouseX;
    startY = mouseY;

    draw(false, true);
  }
}

document.getElementById('imageLoader').addEventListener('change', function (e) {
  Array.from(e.target.files).forEach(file => {
    var reader = new FileReader();
    reader.onload = function (event) {
      var img = new Image();
      img.onload = function () {
        let imgObj = {
          img: img,
          x: 50,
          y: 50,
          width: img.width,
          height: img.height,
          right: 50 + img.width,
          bottom: 50 + img.height
        };
        images.push(imgObj);
        draw(true, false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
});

canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("mouseout", handleMouseUp);

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  updateCanvasOffset();
  draw(true, false);
});

// Initialize canvas size
window.dispatchEvent(new Event('resize'));
