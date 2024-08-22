var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var offsetX, offsetY;
var images = []; // Array to store multiple images
var draggingResizer = -1, draggingImage = -1;
var activeImage = -1;  // Track the active (selected) image
var startX, startY;

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const lines = text.split('\n'); // Split the text by newline character

  lines.forEach(line => {
    let words = line.split(' ');
    let currentLine = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        context.fillText(currentLine, x, y);
        currentLine = words[n] + ' ';
        y += lineHeight;
      } else {
        currentLine = testLine;
      }
    }
    context.fillText(currentLine, x, y);
    y += lineHeight; // Move to the next line
  });
}


function drawInstructions() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  // Set the font and alignment for the instruction text
  ctx.font = "24px Arial";
  ctx.fillStyle = "gray";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Set maximum width for each line and line height
  const maxWidth = canvas.width * 0.9; // 80% of the canvas width
  const lineHeight = 38; // Adjust the space between lines

  // Instruction text with manual line breaks
  const text = "DragON Canvas \n\nUpload images with button (top left).\nClick image to bring forward.\nClick image again to drag it.\nResize using border corners. \nPage reload removes all images.";

  // Calculate the starting y position to center the text block vertically
  const y = canvas.height / 3 - (lineHeight * 1.5);

  // Draw the wrapped text with line breaks
  wrapText(ctx, text, canvas.width / 2, y, maxWidth, lineHeight);
}


function updateCanvasOffset() {
  const rect = canvas.getBoundingClientRect();
  offsetX = rect.left;
  offsetY = rect.top;
}

function draw(withAnchors, withBorders) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (images.length === 0) {
    drawInstructions(); // Draw the instructions if no images are loaded
    return; // Exit the function since there's nothing else to draw
  }
  
  images.forEach((imgObj, index) => {
    ctx.drawImage(imgObj.img, 0, 0, imgObj.img.width, imgObj.img.height, imgObj.x, imgObj.y, imgObj.width, imgObj.height);

    if (withAnchors && activeImage === index) {
      // Adjusted for the 20px border
      drawDragAnchorMuted(imgObj.x - 10, imgObj.y - 10, 'rgba(0, 0, 0, 0.1)'); // Top-left

      drawDeleteButton(imgObj.right + 30, imgObj.y - 30, 'rgba(255, 0, 0, 1)'); // Top-right (Delete button)

     drawDragAnchor(imgObj.right + 10, imgObj.bottom + 10, 'rgba(0, 0, 0, 1)'); // Bottom-right

      drawDragAnchorMuted(imgObj.x - 10, imgObj.bottom + 10, 'rgba(0, 0, 0, 0.1)'); // Bottom-left
    }

    if (withBorders && activeImage === index) {
      ctx.lineWidth = 20; // Set the border width to 20px
      ctx.strokeStyle = 'white'; // Set the border color to white
      
      ctx.beginPath();
      ctx.moveTo(imgObj.x - 10, imgObj.y - 10); // Offset by 10px for border width
      ctx.lineTo(imgObj.right + 10, imgObj.y - 10); // Offset by 10px for border width
      ctx.lineTo(imgObj.right + 10, imgObj.bottom + 10); // Offset by 10px for border width
      ctx.lineTo(imgObj.x - 10, imgObj.bottom + 10); // Offset by 10px for border width
      ctx.closePath();
      ctx.stroke();
    }
  });
}

function drawDragAnchor(x, y, color) {
  const size = 20; // Size of the square (you can adjust this value)

  ctx.fillStyle = color; // Use color parameter for different handles
  ctx.fillRect(x - size / 2, y - size / 2, size, size); // Draw a square
}

function drawDragAnchorMuted(x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2, false);
  ctx.closePath();
  ctx.fillStyle = color; // Use color parameter for different handles
  ctx.fill();
}


function drawDeleteButton(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 10, y - 10, 20, 20); // Draw a red square button

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 7);
  ctx.lineTo(x + 7, y + 7);
  ctx.moveTo(x + 7, y - 7);
  ctx.lineTo(x - 7, y + 7);
  ctx.stroke(); // Draw an "X" inside the button
}

function anchorHitTest(x, y) {
  for (let i = 0; i < images.length; i++) {
    let imgObj = images[i];
    let dx, dy;

    // Check for delete button hit test
    dx = x - (imgObj.right + 30); // Adjust for 20px border and 10px extra offset
    dy = y - (imgObj.y - 30);     // Adjust for 20px border and 10px extra offset
    if (dx * dx + dy * dy <= 100) return { index: i, anchor: 4 };

    // Adjust for border width (20px)
    dx = x - (imgObj.x - 10);
    dy = y - (imgObj.y - 10);
    if (dx * dx + dy * dy <= 64) return { index: i, anchor: 0 };

    dx = x - (imgObj.right + 10);
    dy = y - (imgObj.y - 10);
    if (dx * dx + dy * dy <= 64) return { index: i, anchor: 1 };

    dx = x - (imgObj.right + 10);
    dy = y - (imgObj.bottom + 10);
    if (dx * dx + dy * dy <= 64) return { index: i, anchor: 2 };

    dx = x - (imgObj.x - 10);
    dy = y - (imgObj.bottom + 10);
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

  if (draggingResizer === 4) {
    // Handle deletion of the image if the delete button is clicked
    if (draggingImage !== -1) {
      images.splice(draggingImage, 1); // Remove the image from the array
      draggingResizer = -1;
      draggingImage = -1;
      activeImage = -1;
      draw(true, false); // Redraw the canvas without the deleted image
    }
  } else {
    if (draggingImage === -1) {
      draggingImage = hitImage(startX, startY);
    }

    if (draggingImage !== -1) {
      activeImage = draggingImage; // Set the clicked image as active

      // Bring the clicked image to the front
      let imgObj = images.splice(draggingImage, 1)[0];
      images.push(imgObj);

      // Update activeImage to the new index of the moved image (last in array)
      activeImage = images.length - 1;

      draw(true, true); // Redraw the canvas with the new active image at the front
    } else {
      activeImage = -1; // Deselect any active image if the canvas or an empty area is clicked
      draw(false, false);
    }
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

// Load images and resize to fit within 300px height, scattered randomly
document.getElementById('imageLoader').addEventListener('change', function (e) {
  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        let maxHeight = 300;
        let aspectRatio = img.width / img.height;
        let width, height;

        if (img.height > maxHeight) {
          height = maxHeight;
          width = maxHeight * aspectRatio;
        } else {
          height = img.height;
          width = img.width;
        }

        // Generate random x and y positions, within 300px from top or left of the viewport
        let x = Math.random() * 300;
        let y = Math.random() * 300;

        let imgObj = {
          img: img,
          x: x,
          y: y,
          width: width,
          height: height,
          right: x + width,
          bottom: y + height
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
